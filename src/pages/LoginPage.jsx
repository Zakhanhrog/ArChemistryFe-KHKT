import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAuthStore from '@/hooks/useAuth';
import { initializeGoogleAuth, renderGoogleButton } from '@/utils/googleAuth';
import { googleLogin, getCurrentUser } from '@/services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Navigate to loading page immediately with login credentials
    navigate('/login-loading', { 
      replace: true,
      state: { 
        type: 'regular', 
        email, 
        password 
      }
    });
  };

  const handleGoogleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError(''); // Clear previous errors
    
    // Tìm hidden button container
    const buttonContainer = document.getElementById('google-signin-button');
    if (!buttonContainer) {
      setError('Nút Google chưa sẵn sàng. Vui lòng đợi và thử lại.');
      return;
    }

    // Tìm iframe của Google button
    const iframe = buttonContainer.querySelector('iframe');
    if (iframe) {
      // Trên mobile, cần trigger click vào iframe
      try {
        // Thử click trực tiếp vào iframe
        iframe.click();
        
        // Hoặc thử trigger click vào element bên trong iframe
        const buttonElement = buttonContainer.querySelector('div[role="button"]') || 
                             buttonContainer.querySelector('button') ||
                             buttonContainer.querySelector('div');
        if (buttonElement) {
          buttonElement.click();
        }
      } catch (err) {
        console.error('Error clicking Google button:', err);
      }
      return;
    }

    // Tìm button element bên trong (có thể là div hoặc button)
    const buttonElement = buttonContainer.querySelector('div[role="button"]') || 
                         buttonContainer.querySelector('button') ||
                         buttonContainer.querySelector('div');
    
    if (buttonElement) {
      // Trigger click vào button element
      try {
        buttonElement.click();
      } catch (err) {
        console.error('Error clicking button element:', err);
      }
      return;
    }

    // Nếu không tìm thấy button, thử trigger One Tap
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Thử lại tìm button sau một chút
            setTimeout(() => {
              const btn = buttonContainer.querySelector('div[role="button"]') || 
                         buttonContainer.querySelector('button') ||
                         buttonContainer.querySelector('div') ||
                         buttonContainer.querySelector('iframe');
              if (btn) {
                try {
                  btn.click();
                } catch (err) {
                  console.error('Error clicking button:', err);
                }
              } else {
                setError('Nút Google chưa sẵn sàng. Vui lòng đợi và thử lại.');
              }
            }, 500);
          }
        });
      } catch (e) {
        setError('Không thể khởi động Google Sign-In. Vui lòng thử lại.');
      }
    } else {
      setError('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.');
    }
  };

  useEffect(() => {
    const handleGoogleSuccess = async (idToken) => {
      setError('');

      // Navigate to loading page immediately with Google token
      navigate('/login-loading', { 
        replace: true,
        state: { 
          type: 'google', 
          idToken 
        }
      });
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

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [setUser, navigate]);

  // Khởi tạo Vanta Clouds background với speed = 0
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
          speed: 0,
        });
      }
    };

    // Kiểm tra nếu VANTA đã sẵn sàng
    if (typeof window !== 'undefined' && window.VANTA) {
      initVanta();
    } else {
      // Đợi scripts load xong
      const checkVanta = setInterval(() => {
        if (typeof window !== 'undefined' && window.VANTA) {
          clearInterval(checkVanta);
          initVanta();
        }
      }, 100);

      // Timeout sau 5 giây nếu scripts không load
      setTimeout(() => {
        clearInterval(checkVanta);
      }, 5000);
    }

    return () => {
      mounted = false;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden bg-white transition-opacity duration-[400ms] ease-out ${
      pageLoaded && !isFadingOut ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Vanta Clouds Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Đăng nhập</h1>
        <button
          onClick={() => handleNavigate('/register')}
          className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Đăng ký
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email/Username Field */}
            <div className="relative">
              <Input
                id="email"
                type="text"
                placeholder="Email hoặc tên đăng nhập"
                className="h-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                className="h-12 pr-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              className="h-12 w-full gap-2 text-white shadow-lg"
              style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1373C4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1689E4'} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  ĐĂNG NHẬP
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex justify-center py-2">
            <span className="text-xs uppercase text-gray-700 font-medium">hoặc</span>
          </div>

          {/* Google Login Button - Custom Design with Hidden Button */}
          <div className="relative w-full h-12" style={{ zIndex: 20 }}>
            {/* Hidden Google button for actual authentication - completely hidden */}
            <div id="google-signin-button" className="absolute opacity-0 pointer-events-none" style={{ width: '1px', height: '1px', overflow: 'hidden', zIndex: -1 }}></div>
            
            {/* Custom overlay button to trigger click */}
            <button
              type="button"
              onClick={handleGoogleClick}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
              }}
              className="absolute inset-0 w-full h-12 rounded-full border border-white/20 bg-white/25 backdrop-blur-2xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
              style={{ 
                zIndex: 20,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {/* Google Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0" style={{ pointerEvents: 'none' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {/* Text */}
              <span className="text-sm font-medium text-gray-800" style={{ pointerEvents: 'none' }}>Đăng nhập bằng Google</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default LoginPage;
