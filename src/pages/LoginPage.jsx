import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Check, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAuthStore from '@/hooks/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { login } = await import('@/services/authService');
      const response = await login({ email, password });
      
      setUser({
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        token: response.token
      });
      navigate('/ar?tab=profile');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Đăng nhập</h1>
        <Link to="/register" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Đăng ký
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* User Icon */}
          <div className="flex justify-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Email hoặc tên đăng nhập"
                className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                className="h-12 pr-20 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                <button
                  type="button"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => alert('Chức năng quên mật khẩu sẽ được thêm sau')}
                >
                  <Lock className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              className="h-12 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" 
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button 
            type="button"
            variant="outline"
            className="h-12 w-full gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
            onClick={() => alert('Chức năng đăng nhập bằng Google sẽ được thêm sau')}
          >
            <Chrome className="h-5 w-5" />
            Đăng nhập bằng Google
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default LoginPage;
