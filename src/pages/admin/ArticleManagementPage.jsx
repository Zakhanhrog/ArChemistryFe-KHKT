import { useState, useEffect, useRef } from 'react';
import { 
  getAllArticles, 
  createArticle, 
  updateArticle, 
  deleteArticle, 
  toggleArticleStatus 
} from '@/services/adminArticleService';
import { uploadFile } from '@/services/uploadService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Power, Image as ImageIcon, X, Bold, Italic, Underline, List, Link } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';

export default function ArticleManagementPage() {
  const toast = useToast();
  const confirmDialog = useConfirmDialog();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    imageUrl: '',
    isActive: true,
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const fileInputRef = useRef(null);
  const editorImageInputRef = useRef(null);

  useEffect(() => {
    loadArticles();
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ngày trước`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} tháng trước`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} năm trước`;
  };

  // Check if form has changes
  const hasFormChanges = () => {
    if (!initialFormData) return false;
    
    const editorContent = editor ? editor.getHTML() : formData.content;
    return (
      formData.title !== initialFormData.title ||
      formData.description !== initialFormData.description ||
      formData.category !== initialFormData.category ||
      formData.imageUrl !== initialFormData.imageUrl ||
      formData.isActive !== initialFormData.isActive ||
      editorContent !== initialFormData.content
    );
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable link in StarterKit to use custom LinkExtension
        link: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== formData.content) {
        setFormData(prev => ({ ...prev, content: html }));
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        'data-placeholder': 'Nhập nội dung bài viết...',
      },
    },
  });

  // Update editor content when formData.content changes externally (e.g., when editing)
  useEffect(() => {
    if (editor && showForm) {
      const currentContent = editor.getHTML();
      if (formData.content !== currentContent) {
        editor.commands.setContent(formData.content || '');
      }
    }
  }, [formData.content, editor, showForm]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setImageFile(file);
    setUploadingImage(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const imageUrl = await uploadFile(file, 'articles');
      setFormData({ ...formData, imageUrl });
      toast.success('Upload ảnh thành công');
    } catch (error) {
      toast.error('Lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditorImageInsert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    try {
      const imageUrl = await uploadFile(file, 'articles');
      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl }).run();
      }
      toast.success('Thêm ảnh thành công');
    } catch (error) {
      toast.error('Lỗi khi upload ảnh');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get latest content from editor
    const finalContent = editor ? editor.getHTML() : formData.content;
    const submitData = { ...formData, content: finalContent };
    
    if (!submitData.title.trim() || !submitData.content.trim() || submitData.content === '<p></p>') {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, submitData);
        toast.success('Cập nhật bài viết thành công');
      } else {
        await createArticle(submitData);
        toast.success('Tạo bài viết thành công');
      }
      setShowForm(false);
      resetForm();
      loadArticles();
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    const newFormData = {
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      category: article.category || '',
      imageUrl: article.imageUrl || '',
      isActive: article.isActive !== undefined ? article.isActive : true,
    };
    setFormData(newFormData);
    setInitialFormData({ ...newFormData });
    setImagePreview(article.imageUrl || '');
    setImageFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog.confirm(
      'Bạn có chắc chắn muốn xóa bài viết này?',
      {
      title: 'Xóa bài viết',
        variant: 'destructive',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
      }
    );

    if (confirmed) {
      try {
        await deleteArticle(id);
        toast.success('Xóa bài viết thành công');
        loadArticles();
      } catch (error) {
        toast.error('Không thể xóa bài viết');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleArticleStatus(id);
      toast.success('Cập nhật trạng thái thành công');
      loadArticles();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const resetForm = () => {
    const emptyFormData = {
      title: '',
      description: '',
      content: '',
      category: '',
      imageUrl: '',
      isActive: true,
    };
    setFormData(emptyFormData);
    setInitialFormData({ ...emptyFormData });
    if (editor) {
      editor.commands.setContent('');
    }
    setEditingArticle(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleCloseForm = () => {
    if (hasFormChanges()) {
      setShowConfirmClose(true);
    } else {
      setShowForm(false);
      resetForm();
    }
  };

  const confirmCloseForm = () => {
    setShowConfirmClose(false);
    setShowForm(false);
    resetForm();
  };

  const cancelCloseForm = () => {
    setShowConfirmClose(false);
  };

  const filteredArticles = showInactive 
    ? articles 
    : articles.filter(article => article.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Bài viết</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý các bài viết về hóa học</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Ẩn bài viết ẩn' : 'Hiện bài viết ẩn'}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setInitialFormData({
                title: '',
                description: '',
                content: '',
                category: '',
                imageUrl: '',
                isActive: true,
              });
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm bài viết
          </Button>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Đang tải...</p>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Chưa có bài viết nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="relative z-0">
              <CardContent className="p-4 relative z-0">
                <div className="flex items-start justify-between gap-4 relative z-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{article.title}</h3>
                      {!article.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          Ẩn
                        </span>
                      )}
                    </div>
                    {article.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {article.category && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {article.category}
                        </span>
                      )}
                      <span>
                        {formatTimeAgo(article.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleStatus(article.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      title={article.isActive ? 'Ẩn bài viết' : 'Hiện bài viết'}
                      className="cursor-pointer"
                      disabled={loading}
                    >
                      <Power className={`h-4 w-4 ${article.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(article);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(article.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
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

      {/* Article Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin bài viết. Bạn có thể format văn bản và thêm hình ảnh.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <Input
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: Lịch sử, Công nghệ"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả ngắn
              </label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả ngắn về bài viết"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hình ảnh bài viết
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData({ ...formData, imageUrl: '' });
                        setImageFile(null);
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {uploadingImage ? 'Đang upload...' : 'Chọn ảnh'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung bài viết *
              </label>
              <div className="border border-gray-300 rounded-lg">
                {/* Toolbar */}
                {editor && (
                  <div className="border-b border-gray-300 p-2 flex flex-wrap items-center gap-2 bg-gray-50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={editor.isActive('bold') ? 'bg-gray-200' : ''}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={editor.isActive('italic') ? 'bg-gray-200' : ''}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={editor.isActive('strike') ? 'bg-gray-200' : ''}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
                    >
                      H1
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
                    >
                      H3
                    </Button>
                    <div className="w-px h-6 bg-gray-300" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = window.prompt('Nhập URL:');
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={editor.isActive('link') ? 'bg-gray-200' : ''}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editorImageInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <input
                      ref={editorImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditorImageInsert}
                      className="hidden"
                    />
                  </div>
                )}
                {/* Editor Content */}
                {editor && (
                  <div className="min-h-[300px]">
                    <EditorContent editor={editor} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Hiển thị bài viết
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Hủy
              </Button>
              <Button type="submit">
                {editingArticle ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Close Dialog */}
      <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm left-1/2 -translate-x-1/2 p-5">
          <DialogHeader className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <X className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-gray-900">
              Bỏ thay đổi?
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng và bỏ các thay đổi này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 pt-3">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 h-10"
              onClick={cancelCloseForm}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10"
              onClick={confirmCloseForm}
            >
              Bỏ thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

