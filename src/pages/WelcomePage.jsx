import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/hooks/useAuth';
import { initializeGoogleAuth, renderGoogleButton } from '@/utils/googleAuth';
import { googleLogin, getCurrentUser, guestLogin } from '@/services/authService';

function WelcomePage() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ar?tab=profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Fade in effect khi page load
  useEffect(() => {
    setPageLoaded(false);
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Hàm để fade out trước khi navigate
  const handleNavigate = (path) => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigate(path);
    }, 400);
  };

  // Vanta Clouds Background
  useEffect(() => {
    let mounted = true;
    const initVanta = () => {
      if (mounted && typeof window !== 'undefined' && window.VANTA && vantaRef.current) {
        vantaEffect.current = window.VANTA.CLOUDS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          skyColor: 0x50bbed,
          speed: 0, // Static background
        });
      }
    };

    if (typeof window !== 'undefined') {
      if (window.VANTA) {
        initVanta();
      } else {
        const checkVanta = setInterval(() => {
          if (window.VANTA) {
            initVanta();
            clearInterval(checkVanta);
          }
        }, 100);
        return () => {
          clearInterval(checkVanta);
          if (vantaEffect.current) {
            vantaEffect.current.destroy();
          }
        };
      }
    }

    return () => {
      mounted = false;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, []);

  // Google Sign-In handlers
  useEffect(() => {
    const handleGoogleSuccess = async (idToken) => {
      setError('');

      // Validate token
      if (!idToken || typeof idToken !== 'string' || idToken.trim() === '') {
        setError('Token Google không hợp lệ. Vui lòng thử lại.');
        return;
      }

      try {
        const response = await googleLogin(idToken);
        
        // Set initial user data
        setUser({
          id: response.id,
          name: response.name,
          username: response.username,
          email: response.email,
          role: response.role,
          token: response.token,
          avatarUrl: response.avatarUrl || null
        });
        
        // Refresh user info from server to ensure avatarUrl is up to date
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser({
              id: currentUser.id,
              name: currentUser.name,
              username: currentUser.username,
              email: currentUser.email,
              role: currentUser.role,
              token: response.token,
              avatarUrl: currentUser.avatarUrl || null
            });
          }
        } catch (refreshError) {
          // Continue with login even if refresh fails
        }
        
        // Use replace: true to prevent going back to login page
        navigate('/ar?tab=profile', { replace: true });
      } catch (err) {
        console.error('Google login error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
        setError(errorMessage);
      }
    };

    const handleGoogleError = (err) => {
      setError(err.message || 'Không thể khởi tạo Google đăng nhập.');
    };

    initializeGoogleAuth(handleGoogleSuccess, handleGoogleError);

    // Render Google button after initialization
    let hasRendered = false;
    
    const renderButton = () => {
      // Tránh render nhiều lần
      if (hasRendered) {
        return;
      }
      
      if (window.google?.accounts?.id) {
        try {
          const buttonElement = document.getElementById('google-signin-button');
          // Kiểm tra nếu đã có iframe thì không render lại
          if (buttonElement && buttonElement.children.length === 0 && !buttonElement.querySelector('iframe')) {
            renderGoogleButton('google-signin-button', handleGoogleSuccess, handleGoogleError);
            hasRendered = true;
          }
        } catch (err) {
          // Error rendering Google button
        }
      }
    };

    // Try to render immediately
    renderButton();

    // Also try after a delay in case Google script loads later
    const timeout = setTimeout(() => {
      if (!hasRendered) {
        renderButton();
      }
    }, 1000);
    
    const interval = setInterval(() => {
      if (window.google?.accounts?.id && !hasRendered) {
        renderButton();
        // Stop checking once button is rendered
        if (document.querySelector('#google-signin-button iframe')) {
          hasRendered = true;
          clearInterval(interval);
          clearTimeout(timeout);
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      hasRendered = false;
    };
  }, [navigate, setUser]);

  const handleGoogleClick = () => {
    setError(''); // Clear previous errors
    
    // Tìm hidden button container
    const buttonContainer = document.getElementById('google-signin-button');
    if (!buttonContainer) {
      setError('Nút Google chưa sẵn sàng. Vui lòng đợi và thử lại.');
      return;
    }

    // Tìm button element bên trong (có thể là div hoặc button)
    const buttonElement = buttonContainer.querySelector('div[role="button"]') || 
                         buttonContainer.querySelector('button') ||
                         buttonContainer.querySelector('div');
    
    if (buttonElement) {
      // Trigger click vào button element
      buttonElement.click();
      return;
    }

    // Nếu không tìm thấy button, thử trigger One Tap
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Thử lại tìm button
            const btn = buttonContainer.querySelector('div[role="button"]') || 
                       buttonContainer.querySelector('button') ||
                       buttonContainer.querySelector('div');
            if (btn) {
              btn.click();
            } else {
              setError('Nút Google chưa sẵn sàng. Vui lòng đợi và thử lại.');
            }
          }
        });
      } catch (e) {
        setError('Không thể khởi động Google Sign-In. Vui lòng thử lại.');
      }
    } else {
      setError('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-opacity duration-400 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Vanta Clouds Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className={`w-full max-w-md transition-all duration-700 ease-out delay-300 ${
            pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="bg-white/25 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 sm:p-10">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <span 
                  className="h-14 sm:h-16 flex items-center font-normal bg-clip-text text-transparent leading-none"
                  style={{ 
                    fontFamily: "'Momo Trust Display', sans-serif", 
                    fontSize: '3.54rem',
                    backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
                  }}
                >
                  chemar.
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-xl font-bold text-center text-gray-900 mb-8">
                Bạn đã có tài khoản chưa?
              </h1>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-6">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-4">
                {/* Register Button */}
                <Button
                  onClick={() => handleNavigate('/register')}
                  className="h-12 w-full gap-2 text-white shadow-lg"
                  style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1373C4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1689E4'}
                >
                  Đăng ký
                </Button>

                {/* Free Trial Button */}
                <Button
                  onClick={async () => {
                    try {
                      setError('');
                      const response = await guestLogin();
                      
                      // Set initial user data
                      setUser({
                        id: response.id,
                        name: response.name,
                        username: response.username,
                        email: response.email,
                        role: response.role,
                        token: response.token,
                        avatarUrl: response.avatarUrl || null
                      });
                      
                      // Navigate to AR page
                      navigate('/ar?tab=profile', { replace: true });
                    } catch (err) {
                      console.error('Guest login error:', err);
                      const errorMessage = err.response?.data?.message || err.message || 'Đăng nhập với tài khoản khách thất bại. Vui lòng thử lại.';
                      setError(errorMessage);
                    }
                  }}
                  className="h-12 w-full gap-2 bg-white/40 backdrop-blur-xl hover:bg-white/50 border-2 border-white/30 text-gray-800 font-semibold shadow-lg transition-all duration-200 relative overflow-hidden animate-pulse-glow hover:scale-[1.02] active:scale-[0.98]"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                >
                  {/* Shimmer effect overlay */}
                  <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                  
                  <span className="text-base relative z-10">Dùng thử miễn phí</span>
                  <span className="text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ml-1.5 shadow-sm animate-badge-pulse relative z-10" style={{ backgroundColor: '#1689E4' }}>FREE TRIAL</span>
                </Button>

                {/* Google Sign-In Button */}
                <div className="relative w-full h-12">
                  {/* Hidden Google button for actual authentication */}
                  <div id="google-signin-button" className="absolute opacity-0 pointer-events-none" style={{ width: '1px', height: '1px', overflow: 'hidden', zIndex: -1 }}></div>
                  
                  {/* Custom overlay button to trigger click */}
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className="absolute inset-0 w-full h-12 rounded-full bg-white/25 backdrop-blur-2xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] z-10"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {/* Google Logo SVG */}
                    <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {/* Text */}
                    <span className="text-sm font-medium text-gray-800">Đăng nhập bằng Google</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Already have account link */}
        <div className={`pb-8 text-center transition-all duration-700 ease-out delay-300 ${
          pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            onClick={() => handleNavigate('/login')}
            className="inline-flex items-center justify-center gap-2 text-base font-bold text-gray-700 hover:text-[#1689E4] transition-colors group"
            style={{ lineHeight: '1.5' }}
          >
            <span style={{ lineHeight: '1.5', display: 'inline-block' }}>Đã có tài khoản</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 animate-bounce-horizontal flex-shrink-0" style={{ marginTop: '1px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;

