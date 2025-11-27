import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import useAuthStore from '@/hooks/useAuth';

function RegisterPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Redirect nếu đã đăng nhập - không cho quay lại trang đăng ký
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ar?tab=explore', { replace: true });
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!agreeToTerms) {
      setError('Vui lòng đồng ý với điều khoản dịch vụ để tiếp tục');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const { register } = await import('@/services/authService');
      await register({
        name: formData.name,
        username: formData.username.trim() || undefined,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      // Hiển thị thông báo thành công
      success('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 4000);
      
      // Chuyển về trang đăng nhập sau 500ms để toast hiển thị
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Đăng ký</h1>
        <button
          onClick={() => handleNavigate('/login')}
          className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          Đăng nhập
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div className="relative">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Họ và tên"
                className="h-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Username Field */}
            <div className="relative">
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Tên đăng nhập (tùy chọn)"
                className="h-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={formData.username}
                onChange={handleChange}
                minLength={3}
                maxLength={50}
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <Input
                id="register-email"
                name="email"
                type="email"
                placeholder="Địa chỉ email"
                className="h-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                className="h-12 pr-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                className="h-12 pr-12 text-base border-white/20 bg-white/25 backdrop-blur-2xl focus:border-white/40 focus:ring-0 placeholder:text-gray-600"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  setError('');
                }}
                  className="peer h-5 w-5 appearance-none rounded border-2 border-white/40 bg-white/25 backdrop-blur-2xl cursor-pointer transition-all checked:bg-[#1689E4] checked:border-[#1689E4] focus:outline-none focus:ring-0"
                />
                <svg
                  className="absolute h-3 w-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <label htmlFor="agreeToTerms" className="text-sm text-gray-800 cursor-pointer leading-relaxed">
                Tôi đồng ý với{' '}
                <Link to="#" className="text-[#1689E4] hover:text-[#1373C4] underline font-medium transition-colors">
                  điều khoản dịch vụ
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <Button 
              type="submit" 
              className="h-12 w-full gap-2 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1373C4')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1689E4')} 
              disabled={isLoading || !agreeToTerms}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  ĐĂNG KÝ
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

export default RegisterPage;
