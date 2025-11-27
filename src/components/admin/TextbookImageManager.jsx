import { useState, useEffect } from 'react';
import {
  getTextbookImages,
  createTextbookImage,
  updateTextbookImage,
  deleteTextbookImage,
} from '@/services/adminTextbookImageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

function TextbookImageManager({ textbookId, textbookName }) {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    textbookId: textbookId,
    imageUrl: '',
    name: '',
    description: '',
    model3dUrl: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [model3dFile, setModel3dFile] = useState(null);
  const [model3dFileName, setModel3dFileName] = useState('');

  useEffect(() => {
    if (textbookId) {
      loadImages();
    }
  }, [textbookId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getTextbookImages(textbookId);
      setImages(data);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Không thể tải danh sách ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      setImageFile(file);
      setImageFileName(file.name);
    }
  };

  const handleModel3dFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
        toast.error('File model 3D phải là định dạng GLB hoặc GLTF');
        return;
      }
      // Validate file size (max 200MB)
      const maxSize = 200 * 1024 * 1024; // 200MB in bytes
      if (file.size > maxSize) {
        toast.error('Kích thước file model 3D không được vượt quá 200MB');
        return;
      }
      setModel3dFile(file);
      setModel3dFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingImage && !imageFile) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    try {
      if (editingImage) {
        await updateTextbookImage(editingImage.id, formData, imageFile, model3dFile);
        toast.success('Cập nhật ảnh thành công');
      } else {
        await createTextbookImage(formData, imageFile, model3dFile);
        toast.success('Thêm ảnh thành công');
      }
      setShowForm(false);
      resetForm();
      loadImages();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setFormData({
      textbookId: image.textbookId,
      imageUrl: image.imageUrl || '',
      name: image.name || '',
      description: image.description || '',
      model3dUrl: image.model3dUrl || '',
      isActive: image.isActive !== undefined ? image.isActive : true,
    });
    setImageFile(null);
    setImageFileName('');
    setModel3dFile(null);
    setModel3dFileName('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog.confirm(
      'Bạn có chắc chắn muốn xóa ảnh này?',
      {
        title: 'Xóa ảnh',
        variant: 'destructive',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      }
    );

    if (confirmed) {
      try {
        await deleteTextbookImage(id);
        toast.success('Xóa ảnh thành công');
        loadImages();
      } catch (error) {
        toast.error('Không thể xóa ảnh');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      textbookId: textbookId,
      imageUrl: '',
      name: '',
      description: '',
      model3dUrl: '',
      isActive: true,
    });
    setImageFile(null);
    setImageFileName('');
    setModel3dFile(null);
    setModel3dFileName('');
    setEditingImage(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý ảnh</h3>
          <p className="text-sm text-gray-600">Sách: {textbookName}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm ảnh
        </Button>
      </div>

      {/* Images List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Đang tải...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Chưa có ảnh nào</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={image.imageUrl}
                    alt={image.name || 'Ảnh'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(image)}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(image.id)}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {image.name && (
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">{image.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingImage ? 'Chỉnh sửa ảnh' : 'Thêm ảnh mới'}
            </DialogTitle>
            <DialogDescription>
              Thêm ảnh và thông tin mô tả cho sách giáo khoa
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên ảnh
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ví dụ: Cấu trúc phân tử nước"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả về ảnh này..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File ảnh {!editingImage && '*'}
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="cursor-pointer"
                  required={!editingImage}
                />
                {imageFileName && (
                  <span className="text-sm text-gray-600">{imageFileName}</span>
                )}
                {editingImage && !imageFile && (
                  <span className="text-sm text-gray-500">Giữ nguyên ảnh hiện tại</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Model 3D (GLB/GLTF)
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleModel3dFileChange}
                  className="cursor-pointer"
                />
                {model3dFileName && (
                  <span className="text-sm text-gray-600">{model3dFileName}</span>
                )}
                {editingImage && !model3dFile && (
                  <span className="text-sm text-gray-500">
                    {editingImage.model3dUrl ? 'Giữ nguyên model hiện tại' : 'Chưa có model 3D'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Hoặc nhập URL model 3D (nếu có)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Model 3D (tùy chọn)
              </label>
              <Input
                name="model3dUrl"
                value={formData.model3dUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/model.glb"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Hiển thị ảnh
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Hủy
              </Button>
              <Button type="submit">
                {editingImage ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TextbookImageManager;

