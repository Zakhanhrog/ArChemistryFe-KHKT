import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import { login, googleLogin, guestLogin, getCurrentUser } from '@/services/authService';

// Security check messages
const securityMessages = [
  'Đang xác thực thông tin đăng nhập...',
  'Đang kiểm tra bảo mật tài khoản...',
  'Đang xác minh thiết bị...',
  'Đang tải dữ liệu người dùng...',
];

function LoginLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

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
          speed: 0.5,
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

  // Perform login and progress animation
  useEffect(() => {
    const loginState = location.state;
    
    // If no login state, redirect back
    if (!loginState || !loginState.type) {
      navigate('/', { replace: true });
      return;
    }

    let progressInterval;
    let successTimer;
    let redirectTimer;
    let messageInterval;

    // Simulate security check messages
    const simulateSecurityMessages = () => {
      let messageIndex = 0;
      messageInterval = setInterval(() => {
        if (messageIndex < securityMessages.length) {
          setCurrentMessage(securityMessages[messageIndex]);
          messageIndex++;
        } else {
          if (messageInterval) clearInterval(messageInterval);
        }
      }, 500); // Each message shows for 500ms
    };

    // Perform login based on type
    const performLogin = async () => {
      try {
        // Start security message simulation
        simulateSecurityMessages();

        let response;
        
        switch (loginState.type) {
          case 'regular':
            response = await login({ 
              email: loginState.email, 
              password: loginState.password 
            });
            break;
          case 'google':
            response = await googleLogin(loginState.idToken);
            break;
          case 'guest':
            response = await guestLogin();
            break;
          default:
            throw new Error('Loại đăng nhập không hợp lệ');
        }

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

        // Login successful - wait 2 more seconds for security checks
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear message interval
        if (messageInterval) clearInterval(messageInterval);
        setCurrentMessage('');

        // Start progress animation
        setIsLoggingIn(false);
        
        // Simulate progress - 3 seconds total (after the 2 seconds wait)
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 1;
          });
        }, 30);

        // Show success icon at 80% (around 2.4 seconds)
        successTimer = setTimeout(() => {
          setShowSuccess(true);
        }, 2400);

        // Redirect after 3 seconds (total 5 seconds: 2s wait + 3s progress)
        redirectTimer = setTimeout(() => {
          navigate('/ar?tab=profile', { replace: true });
        }, 3000);

      } catch (err) {
        // Login failed
        setIsLoggingIn(false);
        setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        
        // Redirect back after showing error for 2 seconds
        setTimeout(() => {
          if (loginState.type === 'regular') {
            navigate('/login', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 2000);
      }
    };

    // Start login process
    performLogin();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (successTimer) clearTimeout(successTimer);
      if (redirectTimer) clearTimeout(redirectTimer);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [location.state, navigate, setUser]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Vanta Clouds Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/25 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 sm:p-10">
            {/* Logo/Brand */}
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

            {/* Loading Content */}
            <div className="flex flex-col items-center space-y-6">
              {/* Icon */}
              <div className="relative">
                {showSuccess ? (
                  <div className="animate-scale-in">
                    <CheckCircle2 className="h-16 w-16 text-green-500" strokeWidth={2} />
                  </div>
                ) : (
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" strokeWidth={2} />
                )}
              </div>

              {/* Message */}
              <div className="text-center">
                {error ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-semibold text-red-600 mb-2">
                      Đăng nhập thất bại
                    </h2>
                    <p className="text-sm text-gray-600">
                      {error}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      {showSuccess ? 'Đăng nhập thành công!' : (isLoggingIn ? 'Đang đăng nhập...' : 'Đang xử lý...')}
                    </h2>
                    <p className="text-sm text-gray-600 min-h-[20px] transition-opacity duration-300">
                      {showSuccess ? 'Đang chuyển hướng...' : (currentMessage || 'Vui lòng đợi trong giây lát')}
                    </p>
                  </>
                )}
              </div>

              {/* Progress Bar - only show if no error */}
              {!error && (
                <div className="w-full max-w-xs mt-4">
                  <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">{progress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginLoadingPage;

