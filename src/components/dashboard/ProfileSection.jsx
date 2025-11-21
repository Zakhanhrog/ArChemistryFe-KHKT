import { useState, useEffect } from 'react';
import { LogOut, Mail, User, Edit, Lock, Shield, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditProfileDialog from './EditProfileDialog';
import ChangePasswordDialog from './ChangePasswordDialog';
import useAuthStore from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/imageUrl';

const accountMenuItems = [
  { id: 'edit', icon: Edit, title: 'Chỉnh sửa hồ sơ', description: 'Cập nhật thông tin cá nhân', color: 'text-blue-600' },
  { id: 'password', icon: Lock, title: 'Đổi mật khẩu', description: 'Thay đổi mật khẩu đăng nhập', color: 'text-gray-600' },
  { id: 'privacy', icon: Shield, title: 'Quyền riêng tư', description: 'Quản lý cài đặt bảo mật', color: 'text-gray-600' },
  { id: 'delete', icon: Trash2, title: 'Xóa tài khoản', description: 'Xóa vĩnh viễn tài khoản của bạn', color: 'text-red-600' },
];

function ProfileSection() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when user changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [user?.avatarUrl]);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/');
  };

  const handleAccountMenuItemClick = (itemId) => {
    switch (itemId) {
      case 'edit':
        setShowEditProfileDialog(true);
        break;
      case 'password':
        setShowChangePasswordDialog(true);
        break;
      case 'privacy':
        // TODO: Implement privacy settings
        console.log('Privacy settings');
        break;
      case 'delete':
        // TODO: Implement delete account
        console.log('Delete account');
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
            <User className="h-10 w-10 text-blue-600" />
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
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

  // Authenticated - Show profile content
  return (
    <>
      <section className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            <CardDescription>Quản lý hồ sơ và tài khoản của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 ring-2 ring-blue-200 overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    key={`${user.avatarUrl}-${refreshKey}`}
                    src={normalizeImageUrl(user.avatarUrl) || ''}
                    alt={user?.name || 'Avatar'}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Error loading avatar:', user.avatarUrl);
                      // Try to reload with cache busting
                      const img = e.target;
                      const originalSrc = img.src;
                      if (!originalSrc.includes('?')) {
                        img.src = originalSrc + '?t=' + Date.now();
                      } else {
                        // If still fails, hide and show default icon
                        img.style.display = 'none';
                      }
                    }}
                    onLoad={() => {
                      console.log('Avatar loaded successfully:', user.avatarUrl);
                    }}
                  />
                ) : (
                <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-gray-900">{user?.name || 'Người dùng'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || 'user@archemistry.com'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quản lý tài khoản</CardTitle>
            <CardDescription>Quản lý thông tin và cài đặt tài khoản của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {accountMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAccountMenuItemClick(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
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

        {/* Logout Button - Outside Account Management */}
        <div className="pt-2 pb-6">
          <Button 
            variant="outline" 
            size="lg"
            className="w-full justify-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-12 text-base font-medium" 
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="h-5 w-5" />
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
            // Force re-render when dialog closes
            setRefreshKey(prev => prev + 1);
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <LogOut className="h-6 w-6 text-red-600" />
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
