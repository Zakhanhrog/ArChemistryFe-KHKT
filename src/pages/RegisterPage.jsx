import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAuthStore from '@/hooks/useAuth';

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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
      const response = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setUser(response);
      navigate('/ar?tab=profile');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Background Decorative Elements - Blue Theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Đăng ký</h1>
        <Link to="/login" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Đăng nhập
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Camera Icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
              <Camera className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <Input
                id="register-email"
                name="email"
                type="email"
                placeholder="Địa chỉ email"
                className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Name Field */}
            <div className="relative">
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tên đăng nhập"
                className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                className="h-12 pr-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                className="h-12 pr-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  setError('');
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer">
                Tôi đồng ý với{' '}
                <Link to="#" className="text-blue-600 hover:text-blue-700 underline">
                  điều khoản dịch vụ
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <Button 
              type="submit" 
              className="h-12 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed" 
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
