import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import useAuthStore from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-[#1689E4] hover:text-[#1373C4] underline font-bold transition-colors"
                >
                  điều khoản dịch vụ
                </button>
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

      {/* Terms of Service Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogPortal>
          <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
          <DialogPrimitive.Content
            className={cn(
              'fixed left-[50%] top-[50%] z-50 flex flex-col w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-2xl max-h-[80vh] translate-x-[-50%] translate-y-[-50%] border border-white/30 bg-white/80 backdrop-blur-2xl shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg overflow-hidden'
            )}
          >
          {/* Fixed Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-white/30 px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Điều khoản dịch vụ</DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-2">
                Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-white/80">
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">1. Chấp nhận điều khoản</h3>
              <p className="mb-4">
                Bằng việc sử dụng dịch vụ của <span 
                  className="font-normal bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: "'Momo Trust Display', sans-serif",
                    backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
                  }}
                >chemar.</span>, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. 
                Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng dịch vụ.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">2. Mô tả dịch vụ</h3>
              <p className="mb-4">
                <span 
                  className="font-normal bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: "'Momo Trust Display', sans-serif",
                    backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
                  }}
                >chemar.</span> là một nền tảng học tập hóa học sử dụng công nghệ thực tế ảo tăng cường (AR) để cung cấp 
                các mô hình 3D tương tác, bài viết giáo dục, và trợ lý AI hỗ trợ học tập. Dịch vụ được cung cấp 
                "như hiện tại" và có thể được cập nhật hoặc thay đổi bất cứ lúc nào.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">3. Tài khoản người dùng</h3>
              <p className="mb-4">
                Để sử dụng một số tính năng của dịch vụ, bạn có thể cần tạo tài khoản. Bạn có trách nhiệm:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Bảo mật thông tin đăng nhập của bạn</li>
                <li>Cung cấp thông tin chính xác và cập nhật</li>
                <li>Thông báo ngay lập tức về bất kỳ vi phạm bảo mật nào</li>
                <li>Chịu trách nhiệm cho tất cả các hoạt động xảy ra dưới tài khoản của bạn</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">4. Quyền sở hữu trí tuệ</h3>
              <p className="mb-4">
                Tất cả nội dung trên <span 
                  className="font-normal bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: "'Momo Trust Display', sans-serif",
                    backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
                  }}
                >chemar.</span>, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, hình ảnh, 
                mô hình 3D, và phần mềm, là tài sản của <span 
                  className="font-normal bg-clip-text text-transparent"
                  style={{ 
                    fontFamily: "'Momo Trust Display', sans-serif",
                    backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
                  }}
                >chemar.</span> hoặc các bên cấp phép của chúng tôi và được 
                bảo vệ bởi luật bản quyền và các luật sở hữu trí tuệ khác.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">5. Sử dụng dịch vụ</h3>
              <p className="mb-4">Bạn đồng ý không sử dụng dịch vụ để:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Vi phạm bất kỳ luật hoặc quy định nào</li>
                <li>Xâm phạm quyền của người khác</li>
                <li>Truyền bá nội dung độc hại, đe dọa, hoặc phỉ báng</li>
                <li>Can thiệp hoặc làm gián đoạn dịch vụ</li>
                <li>Sao chép, phân phối, hoặc sử dụng trái phép nội dung</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">6. Bảo mật dữ liệu</h3>
              <p className="mb-4">
                Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Thông tin cá nhân của bạn được xử lý theo 
                Chính sách Bảo mật của chúng tôi. Bằng việc sử dụng dịch vụ, bạn đồng ý với việc thu thập 
                và sử dụng thông tin của bạn theo chính sách đó.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">7. Từ chối trách nhiệm</h3>
              <p className="mb-4">
                Dịch vụ được cung cấp "như hiện tại" và "như có sẵn". Chúng tôi không đảm bảo rằng dịch vụ 
                sẽ không bị gián đoạn, an toàn, hoặc không có lỗi. Bạn sử dụng dịch vụ với rủi ro của chính mình.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">8. Thay đổi điều khoản</h3>
              <p className="mb-4">
                Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực 
                ngay sau khi được đăng tải. Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi được coi 
                là bạn chấp nhận các điều khoản mới.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2">9. Liên hệ</h3>
              <p className="mb-4">
                Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ với chúng tôi qua 
                email hoặc các kênh hỗ trợ được cung cấp trên trang web.
              </p>
            </section>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowTermsModal(false)}
                className="bg-[#1689E4] hover:bg-[#1373C4] text-white"
              >
                Đã hiểu
              </Button>
            </div>
          </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

export default RegisterPage;
