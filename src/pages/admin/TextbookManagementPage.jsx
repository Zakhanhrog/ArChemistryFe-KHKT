import { useState, useEffect } from 'react';
import { 
  getAllTextbooks, 
  createTextbook, 
  updateTextbook, 
  deleteTextbook 
} from '@/services/adminTextbookService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, BookOpen, Image as ImageIcon } from 'lucide-react';
import TextbookImageManager from '@/components/admin/TextbookImageManager';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const BOOK_SETS = [
  { value: 'canh-dieu', label: 'Bộ sách Cánh Diều' },
  { value: 'ket-noi', label: 'Kết nối tri thức' },
];

const GRADES = [10, 11, 12];

export default function TextbookManagementPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bookSet: 'ket-noi',
    grade: 10,
    coverImageUrl: '',
    isActive: true,
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [selectedTextbookForImages, setSelectedTextbookForImages] = useState(null);

  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    setLoading(true);
    try {
      const data = await getAllTextbooks();
      setTextbooks(data);
    } catch (error) {
      console.error('Error loading textbooks:', error);
      const errorMessage = error.message || 'Không thể tải danh sách sách giáo khoa';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'grade' ? parseInt(value) : value),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        toast.error('Vui lòng chọn file PDF');
        return;
      }
      setPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng điền tên sách');
      return;
    }

    if (!editingTextbook && !pdfFile) {
      toast.error('Vui lòng chọn file PDF');
      return;
    }

    try {
      if (editingTextbook) {
        await updateTextbook(editingTextbook.id, formData, pdfFile);
        toast.success('Cập nhật sách giáo khoa thành công');
      } else {
        await createTextbook(formData, pdfFile);
        toast.success('Tạo sách giáo khoa thành công');
      }
      setShowForm(false);
      resetForm();
      loadTextbooks();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (textbook) => {
    setEditingTextbook(textbook);
    setFormData({
      name: textbook.name || '',
      bookSet: textbook.bookSet || 'ket-noi',
      grade: textbook.grade || 10,
      coverImageUrl: textbook.coverImageUrl || '',
      isActive: textbook.isActive !== undefined ? textbook.isActive : true,
    });
    setPdfFile(null);
    setPdfFileName('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog.confirm(
      'Bạn có chắc chắn muốn xóa sách giáo khoa này?',
      {
        title: 'Xóa sách giáo khoa',
        variant: 'destructive',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      }
    );

    if (confirmed) {
      try {
        await deleteTextbook(id);
        toast.success('Xóa sách giáo khoa thành công');
        loadTextbooks();
      } catch (error) {
        toast.error('Không thể xóa sách giáo khoa');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bookSet: 'ket-noi',
      grade: 10,
      coverImageUrl: '',
      isActive: true,
    });
    setPdfFile(null);
    setPdfFileName('');
    setEditingTextbook(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Sách giáo khoa</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý sách giáo khoa Hóa học</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm sách
        </Button>
      </div>

      {/* Textbooks List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </CardContent>
        </Card>
      ) : textbooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Chưa có sách giáo khoa nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {textbooks
            .sort((a, b) => {
              // Sort by bookSet first, then by grade
              if (a.bookSet !== b.bookSet) {
                return a.bookSet.localeCompare(b.bookSet);
              }
              return a.grade - b.grade;
            })
            .map((textbook) => (
            <Card key={textbook.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{textbook.name}</h3>
                      {!textbook.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Ẩn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {BOOK_SETS.find(bs => bs.value === textbook.bookSet)?.label || textbook.bookSet}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        Lớp {textbook.grade}
                      </span>
                      <span className="text-gray-500">File: {textbook.fileName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Tạo: {formatDate(textbook.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTextbookForImages(textbook)}
                      className="cursor-pointer"
                      disabled={loading}
                      title="Quản lý ảnh"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(textbook)}
                      className="cursor-pointer"
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(textbook.id)}
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Textbook Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTextbook ? 'Chỉnh sửa sách giáo khoa' : 'Thêm sách giáo khoa mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin sách giáo khoa Hóa học.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sách *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Ví dụ: Hóa học 10 - Kết nối tri thức"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bộ sách *
                </label>
                <select
                  name="bookSet"
                  value={formData.bookSet}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {BOOK_SETS.map((bs) => (
                    <option key={bs.value} value={bs.value}>
                      {bs.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lớp *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      Lớp {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File PDF {!editingTextbook && '*'}
              </label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  required={!editingTextbook}
                />
                {pdfFileName && (
                  <span className="text-sm text-gray-600">{pdfFileName}</span>
                )}
                {editingTextbook && !pdfFile && (
                  <span className="text-sm text-gray-500">Giữ nguyên file hiện tại: {editingTextbook.fileName}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {editingTextbook ? 'Chỉ chọn file mới nếu muốn thay thế file hiện tại' : 'Chọn file PDF của sách giáo khoa'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL ảnh bìa (tùy chọn)
              </label>
              <Input
                name="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/cover.jpg"
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
                Hiển thị sách
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Hủy
              </Button>
              <Button type="submit">
                {editingTextbook ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Manager Dialog */}
      {selectedTextbookForImages && (
        <Dialog open={true} onOpenChange={() => setSelectedTextbookForImages(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quản lý ảnh - {selectedTextbookForImages.name}</DialogTitle>
            </DialogHeader>
            <TextbookImageManager
              textbookId={selectedTextbookForImages.id}
              textbookName={selectedTextbookForImages.name}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

