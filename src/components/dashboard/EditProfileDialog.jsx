import { useState, useRef, useEffect } from 'react';
import { User, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updateProfile } from '@/services/authService';
import { uploadFile } from '@/services/uploadService';
import useAuthStore from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/imageUrl';

function EditProfileDialog({ open, onOpenChange, user }) {
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Sync state with user prop when dialog opens or user changes
  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      setAvatarUrl(user.avatarUrl || '');
      // Normalize avatar URL for preview
      setAvatarPreview(user.avatarUrl ? normalizeImageUrl(user.avatarUrl) : '');
      setAvatarFile(null);
      setError('');
    }
  }, [open, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let finalAvatarUrl = null;

      // Upload avatar if new file selected
      if (avatarFile) {
        try {
          finalAvatarUrl = await uploadFile(avatarFile, 'avatars');
          console.log('Avatar uploaded to local storage:', finalAvatarUrl);
          
          // Ensure URL is valid
          if (!finalAvatarUrl || finalAvatarUrl.trim() === '') {
            throw new Error('Không nhận được URL từ server');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError(uploadError.message || 'Lỗi khi upload ảnh. Vui lòng thử lại.');
          setIsLoading(false);
          return;
        }
      } else {
        // Keep existing avatar if no new file - use current user's avatar
        finalAvatarUrl = user?.avatarUrl || null;
      }

      // Update profile - always include avatarUrl
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        avatarUrl: finalAvatarUrl, // Will be new URL if uploaded, or existing URL if not changed, or null
      };

      const response = await updateProfile(updatePayload);

      console.log('Profile update response:', response);
      console.log('Final avatar URL:', finalAvatarUrl);
      console.log('Response avatarUrl:', response.avatarUrl);

      // Update user in store with the response data - prioritize response.avatarUrl
      const updatedAvatarUrl = (response.avatarUrl !== undefined && response.avatarUrl !== null && response.avatarUrl !== '')
        ? response.avatarUrl 
        : (finalAvatarUrl || user?.avatarUrl || null);
      
      console.log('Updated avatar URL to store:', updatedAvatarUrl);
      
      // Update user in store
      setUser({
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        token: response.token,
        avatarUrl: updatedAvatarUrl,
      });

      // Also update localStorage directly to ensure it's saved
      const updatedUser = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role,
        avatarUrl: updatedAvatarUrl,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('User updated in store and localStorage:', updatedUser);

      // Reset form
      setAvatarFile(null);
      // Normalize avatar URL for preview
      setAvatarPreview(updatedAvatarUrl ? normalizeImageUrl(updatedAvatarUrl) : '');
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(err.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] left-1/2 -translate-x-1/2 p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Chỉnh sửa hồ sơ
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Cập nhật thông tin cá nhân của bạn
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Nhấn vào icon camera để thay đổi ảnh đại diện
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập
            </label>
            <Input
              id="edit-name"
              name="name"
              type="text"
              placeholder="Tên đăng nhập"
              className="h-12 text-base rounded-full border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 px-4"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              placeholder="Địa chỉ email"
              className="h-12 text-base rounded-full border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 px-4"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <DialogFooter className="flex-row gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
              disabled={isLoading}
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditProfileDialog;

