import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LogOut, Users, Shield, Target, LayoutDashboard, X, FileText, BookOpen, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminLogout } from '@/services/authService';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
  },
  {
    id: 'ar',
    label: 'Quản lý AR',
    icon: Target,
    path: '/admin/ar',
  },
  {
    id: 'articles',
    label: 'Quản lý Bài viết',
    icon: FileText,
    path: '/admin/articles',
  },
  {
    id: 'textbooks',
    label: 'Quản lý Sách giáo khoa',
    icon: BookOpen,
    path: '/admin/textbooks',
  },
  {
    id: 'users',
    label: 'Quản lý Users',
    icon: Users,
    path: '/admin/users',
  },
  {
    id: 'login-history',
    label: 'Lịch sử đăng nhập',
    icon: History,
    path: '/admin/login-history',
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (!adminData) {
      navigate('/admin/login');
      return;
    }
    setAdminUser(JSON.parse(adminData));
  }, [navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-0 md:w-20',
          isMobile && !sidebarOpen && 'hidden',
          'fixed h-screen z-40'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-gray-900">Admin</span>
              </div>
            )}
            {!sidebarOpen && (
              <Shield className="h-6 w-6 text-blue-600 mx-auto" />
            )}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path === '/admin/dashboard' && location.pathname === '/admin');
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100',
                        !sidebarOpen && 'justify-center'
                      )}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-gray-200 p-4">
            {sidebarOpen ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{adminUser.name}</p>
                  <p className="text-xs text-gray-500">{adminUser.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full p-2"
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col min-w-0 relative z-0"
        style={{
          marginLeft: isMobile ? 0 : (sidebarOpen ? '16rem' : '5rem'),
          transition: 'margin-left 300ms ease-in-out'
        }}
      >
        {/* Content */}
        <main className="flex-1 overflow-y-auto relative z-0">
          <div className="p-4 md:p-6 lg:p-8 relative z-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

