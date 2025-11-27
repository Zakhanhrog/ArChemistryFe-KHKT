import { useState, useEffect } from 'react';
import { Mail, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditProfileDialog from './EditProfileDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
import useAuthStore from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/imageUrl';

const accountMenuItems = [
  { id: 'edit', iconSrc: '/icon/edit.svg', title: 'Chỉnh sửa hồ sơ', description: 'Cập nhật thông tin cá nhân', color: 'text-blue-600' },
  { id: 'password', iconSrc: '/icon/password.svg', title: 'Đổi mật khẩu', description: 'Thay đổi mật khẩu đăng nhập', color: 'text-gray-600' },
];

function ProfileSection() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Force re-render when user changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    setAvatarError(false); // Reset error when avatar URL changes
  }, [user?.avatarUrl, user?.id]);

  // Also listen to localStorage changes to catch updates from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const storedUser = JSON.parse(userStr);
          if (storedUser.avatarUrl !== user?.avatarUrl) {
            setRefreshKey(prev => prev + 1);
          }
        } catch (e) {
          // Error parsing user from localStorage
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check on interval to catch updates from same tab - reduced frequency for better performance
    const interval = setInterval(handleStorageChange, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.avatarUrl]);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/welcome');
  };

  const handleAccountMenuItemClick = (itemId) => {
    switch (itemId) {
      case 'edit':
        setShowEditProfileDialog(true);
        break;
      case 'password':
        setShowChangePasswordDialog(true);
        break;
      default:
        break;
    }
  };

  // Not authenticated - Show beautiful login prompt
  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md flex flex-col items-center gap-6 py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50 overflow-hidden">
            <img 
              src="/icon/canhan.svg" 
              alt="User"
              className="h-8 w-8 object-contain"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-gray-900">Chào mừng đến AR Chemistry</h3>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Đăng nhập để truy cập đầy đủ tính năng, quản lý hồ sơ và tùy chỉnh trải nghiệm AR của bạn
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button 
              size="lg" 
              className="w-full text-white shadow-lg"
              style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1373C4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1689E4'}
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => navigate('/register')}
            >
              Tạo tài khoản mới
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Check if user is guest
  const isGuest = user?.role === 'GUEST';

  // Authenticated - Show profile content
  return (
    <>
      <section className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isGuest ? 'Thông tin khách' : 'Thông tin cá nhân'}</CardTitle>
            <CardDescription>{isGuest ? 'Tài khoản khách - Dùng thử miễn phí' : 'Quản lý hồ sơ và tài khoản của bạn.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-2 ring-blue-200 overflow-hidden">
                {user?.avatarUrl && user.avatarUrl.trim() !== '' && !avatarError ? (
                  <img
                    key={`${user.avatarUrl}-${refreshKey}`}
                    src={`${normalizeImageUrl(user.avatarUrl)}?t=${refreshKey}`}
                    alt={user?.name || 'Avatar'}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    onError={() => {
                      setAvatarError(true);
                    }}
                    onLoad={() => {
                      setAvatarError(false);
                    }}
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p 
                  className="font-medium text-gray-900"
                  style={{ fontFamily: "'Momo Signature', sans-serif", fontWeight: 500 }}
                >
                  {isGuest ? 'Khách' : (user?.name || 'Người dùng')}
                </p>
                {!isGuest && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email || 'user@archemistry.com'}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management - Only show for non-guest users */}
        {!isGuest && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quản lý tài khoản</CardTitle>
              <CardDescription>Quản lý thông tin và cài đặt tài khoản của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {accountMenuItems.map((item) => {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAccountMenuItemClick(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <img 
                      src={item.iconSrc} 
                      alt={item.title}
                      className="h-9 w-9 object-contain -mt-0.5"
                    />
                    <div className="flex-1 text-left">
                      <p className={`font-medium text-sm ${item.id === 'delete' ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Logout Button - Outside Account Management */}
        <div className="pt-2 pb-6">
          <Button 
            variant="outline" 
            size="lg"
            className="w-full justify-center border-gray-300 text-gray-700 hover:bg-red-50 h-12 text-base font-medium" 
            onClick={() => setShowLogoutDialog(true)}
          >
            Đăng xuất
          </Button>
        </div>
      </section>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={showEditProfileDialog}
        onOpenChange={(open) => {
          setShowEditProfileDialog(open);
          if (!open) {
            // Force re-render when dialog closes to show updated avatar
            setTimeout(() => {
            setRefreshKey(prev => prev + 1);
            }, 200);
          }
        }}
        user={user}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm left-1/2 -translate-x-1/2 p-5">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex items-center justify-center">
              <img 
                src="/icon/logout.svg" 
                alt="Đăng xuất"
                className="h-12 w-12 object-contain"
              />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-gray-900">
              Xác nhận đăng xuất
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 pt-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
              onClick={() => setShowLogoutDialog(false)}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10"
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProfileSection;
