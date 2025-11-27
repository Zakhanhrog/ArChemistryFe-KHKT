/**
 * Google OAuth utility
 * Sử dụng Google Identity Services để đăng nhập
 */

const getClientId = () => {
  // Google OAuth Client ID
  return '700398442370-0dfqk14t9qun39lts39c1u37f332ni95.apps.googleusercontent.com';
};

export const initializeGoogleAuth = (onSuccess, onError) => {
  const clientId = getClientId();
  if (!clientId || clientId.trim() === '') {
    onError(new Error('Google Client ID chưa được cấu hình'));
    return;
  }

  // Wait for Google Identity Services to load
  const checkGoogleAuth = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            if (response && response.credential) {
              onSuccess(response.credential);
            } else {
              onError(new Error('Không nhận được token từ Google'));
            }
          } catch (err) {
            console.error('Error in Google callback:', err);
            onError(new Error('Lỗi xử lý phản hồi từ Google: ' + err.message));
          }
        },
      });
      return true;
    }
    return false;
  };

  // Try immediately
  if (checkGoogleAuth()) {
    return;
  }

  // If not ready, wait for it - reduced frequency for better performance
  const interval = setInterval(() => {
    if (checkGoogleAuth()) {
      clearInterval(interval);
    }
  }, 200);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(interval);
    if (!window.google?.accounts?.id) {
      onError(new Error('Không thể tải Google Identity Services'));
    }
  }, 10000);
};

export const promptGoogleLogin = () => {
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa được khởi tạo');
  }
  
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback to button click
      return;
    }
  });
};

export const renderGoogleButton = (elementId, onSuccess, onError) => {
  if (!window.google?.accounts?.id) {
    onError(new Error('Google Identity Services chưa được khởi tạo'));
    return;
  }

  const buttonElement = document.getElementById(elementId);
  if (!buttonElement) {
    return;
  }

  // Kiểm tra nếu button đã được render rồi thì không render lại
  if (buttonElement.querySelector('iframe')) {
    return;
  }

  // Wait a bit for the element to be properly sized
  setTimeout(() => {
    // Get the width of the container
    const containerWidth = buttonElement.offsetWidth || buttonElement.parentElement?.offsetWidth || 400;
    
    // Clear any existing content
    buttonElement.innerHTML = '';

    try {
  window.google.accounts.id.renderButton(
      buttonElement,
    {
          theme: 'filled_white',
      size: 'large',
      text: 'signin_with',
        width: containerWidth,
      locale: 'vi',
          shape: 'pill',
    }
  );
    } catch (err) {
      console.error('Error rendering Google button:', err);
      onError(err);
    }
  }, 100);
};

export const triggerGoogleLogin = (onSuccess, onError) => {
  if (!window.google?.accounts?.id) {
    onError(new Error('Google Identity Services chưa được khởi tạo. Vui lòng đợi một chút và thử lại.'));
    return;
  }

  try {
    // Try to trigger One Tap prompt
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // If One Tap is not available, try to click the rendered button
        const buttonElement = document.querySelector('#google-signin-button iframe');
        if (buttonElement) {
          // Try to click the iframe (may not work due to cross-origin restrictions)
          buttonElement.contentWindow?.postMessage('click', '*');
        } else {
          // If button is not rendered yet, show error
          onError(new Error('Vui lòng đợi nút đăng nhập Google hiển thị và thử lại.'));
        }
      }
    });
  } catch (err) {
    onError(new Error('Không thể khởi động đăng nhập Google. Vui lòng thử lại.'));
  }
};

