/**
 * Google OAuth utility
 * Sử dụng Google Identity Services để đăng nhập
 */

const getClientId = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId.trim() === '') {
    console.error('VITE_GOOGLE_CLIENT_ID chưa được cấu hình trong file .env');
    return null;
  }
  return clientId;
};

export const initializeGoogleAuth = (onSuccess, onError) => {
  const clientId = getClientId();
  if (!clientId) {
    onError(new Error('Google Client ID chưa được cấu hình. Vui lòng thêm VITE_GOOGLE_CLIENT_ID vào file .env'));
    return;
  }

  // Wait for Google Identity Services to load
  const checkGoogleAuth = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError(new Error('Không nhận được token từ Google'));
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

  // If not ready, wait for it
  const interval = setInterval(() => {
    if (checkGoogleAuth()) {
      clearInterval(interval);
    }
  }, 100);

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

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: '100%',
      locale: 'vi',
    }
  );
};

