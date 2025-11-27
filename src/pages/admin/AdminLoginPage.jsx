import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminLogin } from '@/services/authService';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in as admin
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminLogin({ email, password });
      
      // Store admin info
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUser', JSON.stringify({
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role
      }));
      
      // Use replace: true to prevent going back to login page
      navigate('/admin/dashboard', { replace: true });
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Login</h1>
          <a href="/" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Về trang chủ
          </a>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            {/* Admin Icon */}
            <div className="flex justify-center">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              </div>
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
                  className="h-12 text-base border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
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
                  className="h-12 pr-12 text-base border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
                    ĐĂNG NHẬP ADMIN
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

export default AdminLoginPage;

