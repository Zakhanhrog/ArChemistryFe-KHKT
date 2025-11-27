import { useState, useEffect, useRef } from 'react';
import { getTextbookImages } from '@/services/textbookImageService';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Box, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function TextbookImagesSection({ textbookId }) {
  const [images, setImages] = useState([]);
  const [allImages, setAllImages] = useState([]); // Store all images for filtering
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);
  const [viewModeKey, setViewModeKey] = useState(0); // Force re-render when view mode changes
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (textbookId) {
      loadImages();
    }
  }, [textbookId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const data = await getTextbookImages(textbookId);
      // Sort by name with natural sort (handles numbers correctly)
      const sortedData = [...data].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        // Natural sort: handles numbers in strings correctly
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
      setAllImages(sortedData);
      setImages(sortedData);
      setFilteredImages(sortedData);
    } catch (error) {
      console.error('Error loading textbook images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(allImages);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allImages.filter(image => {
        const name = (image.name || '').toLowerCase();
        return name.includes(query);
      });
      setFilteredImages(filtered);
    }
  }, [searchQuery, allImages]);

  // Track previous view mode to detect changes
  const prevViewModeRef = useRef(null);
  
  // Initialize view mode on mount
  useEffect(() => {
    if (prevViewModeRef.current === null && filteredImages.length > 0) {
      prevViewModeRef.current = filteredImages.length > 3;
    }
  }, [filteredImages.length]);

  // Update displayed images when filtered images change
  useEffect(() => {
    const newLength = filteredImages.length;
    const isListView = newLength > 3;
    const prevViewMode = prevViewModeRef.current;
    
    // Detect view mode change
    if (prevViewMode !== null && prevViewMode !== isListView) {
      setViewModeKey(prev => prev + 1);
    }
    
    // Update previous view mode
    prevViewModeRef.current = isListView;
    
    // Update images
    setImages(filteredImages);
    
    // Reset scroll position khi chuyển view mode hoặc khi filtered images thay đổi
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [filteredImages]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -140, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 140, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="bg-white border-t border-gray-200 py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Hình ảnh trong sách</h3>
            {searchQuery.trim() && (
              <span className="text-xs text-gray-500">
                ({filteredImages.length} kết quả)
              </span>
            )}
            {allImages.length > 0 && (
              <>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Tìm kiếm hình ảnh"
                >
                  <Search className="h-4 w-4 text-gray-600" />
                </button>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                )}
              </>
            )}
          </div>
          {images.length > 3 && (
            <div className="flex items-center gap-1">
              <button
                onClick={scrollLeft}
                className="p-1.5 rounded-full"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={scrollRight}
                className="p-1.5 rounded-full"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            Đang tải ảnh...
          </div>
        ) : images.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            {searchQuery.trim() ? (
              <>
                <p>Không tìm thấy hình ảnh nào với từ khóa "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Xóa tìm kiếm
                </button>
              </>
            ) : (
              'Chưa có ảnh nào được cập nhật'
            )}
          </div>
        ) : images.length > 3 ? (
          <div className="-mx-4 px-4" key={`list-view-${viewModeKey}-${images.length}`}>
            <div className="overflow-x-auto" ref={scrollContainerRef}>
              <div className="flex gap-2" style={{ width: 'max-content' }}>
                {images.map((image) => (
                  <Card
                    key={image.id}
                    className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden relative group flex-shrink-0"
                    style={{ width: '120px' }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gray-100 relative" style={{ width: '120px', height: '120px' }}>
                        <img
                          src={image.imageUrl}
                          alt={image.name || 'Hình ảnh'}
                          className="w-full h-full object-cover"
                        />
                        {/* Model 3D Tag */}
                        {image.model3dUrl && (
                          <div className="absolute top-2 right-2 text-white p-1.5 rounded-md shadow-lg z-10 flex items-center justify-center" style={{ backgroundColor: '#1689E4' }}>
                            <Box className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {/* Overlay with image name */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent flex items-end">
                          <p className="text-white text-xs font-medium p-2 line-clamp-2 w-full">
                            {image.name || 'Hình ảnh'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2" key={`grid-view-${viewModeKey}-${images.length}`}>
            {images.map((image) => (
              <Card
                key={image.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden relative group"
                onClick={() => setSelectedImage(image)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={image.imageUrl}
                      alt={image.name || 'Hình ảnh'}
                      className="w-full h-full object-cover"
                    />
                    {/* Model 3D Tag */}
                    {image.model3dUrl && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white p-1.5 rounded-md shadow-lg z-10 flex items-center justify-center">
                        <Box className="h-3.5 w-3.5" />
                      </div>
                    )}
                    {/* Overlay with image name */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent flex items-end">
                      <p className="text-white text-xs font-medium p-2 line-clamp-2 w-full">
                        {image.name || 'Hình ảnh'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Search Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:w-[calc(100%-4rem)]">
          <DialogHeader>
            <DialogTitle>Tìm kiếm hình ảnh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Ví dụ: Hình 1.1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Hãy nhập tên hình muốn tìm kiếm (ví dụ: Hình 1.1)
              </p>
            </div>
            {searchQuery.trim() && (
              <div className="text-sm text-gray-600">
                Tìm thấy {filteredImages.length} hình ảnh
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchModal(false);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  setShowSearchModal(false);
                }}
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}

function ImageDetailModal({ image, onClose }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Load A-Frame dynamically if 3D model exists
    if (image.model3dUrl && !window.AFRAME) {
      const script = document.createElement('script');
      script.src = 'https://aframe.io/releases/1.5.0/aframe.min.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) {
        document.body.removeChild(script);
        }
      };
    }
  }, [image.model3dUrl]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      // Wait for animation to complete before calling onClose
      setTimeout(() => {
        onClose();
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 !fixed !bottom-0 !left-0 !right-0 !top-auto !translate-x-0 !translate-y-0 rounded-t-[10px] rounded-b-none !mt-24 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full duration-300 ease-out"
        style={{
          maxWidth: '100%',
          width: '100%',
          transform: 'none'
        }}
      >
        {/* Drag handle giống drawer */}
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        
        <DialogHeader className="px-6 pt-4 pb-4 border-b text-left">
          <DialogTitle className="text-xl font-bold pr-8">
            {image.name || 'Hình ảnh'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto space-y-4 flex-1" style={{ pointerEvents: 'auto' }}>
          {/* Image */}
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image.imageUrl}
              alt={image.name || 'Hình ảnh'}
              className="w-full h-auto max-h-[400px] object-contain mx-auto"
            />
          </div>

          {/* Description */}
          {image.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{image.description}</p>
            </div>
          )}

          {/* 3D Model */}
          {image.model3dUrl && (
            <div 
              className="w-full bg-gray-100 rounded-lg overflow-hidden relative" 
              style={{ 
                height: '500px',
                minHeight: '500px',
                touchAction: 'none',
                pointerEvents: 'auto',
                isolation: 'isolate'
              }}
              onTouchStart={(e) => {
                // Cho phép touch events pass through
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                // Cho phép mouse events pass through
                e.stopPropagation();
              }}
            >
              {/* @ts-ignore */}
              <model-viewer
                src={image.model3dUrl}
                alt={image.name || '3D Model'}
                auto-rotate
                camera-controls
                interaction-policy="always-allow"
                touch-action="none"
                disable-zoom={false}
                rotation-per-second="30deg"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  touchAction: 'none',
                  userSelect: 'none',
                  pointerEvents: 'auto',
                  cursor: 'grab',
                  display: 'block'
                }}
                onLoad={(e) => {
                  // Đảm bảo model-viewer có thể tương tác
                  const modelViewer = e.target;
                  if (modelViewer) {
                    modelViewer.setAttribute('interaction-policy', 'always-allow');
                    modelViewer.setAttribute('camera-controls', 'true');
                    // Focus vào model-viewer để đảm bảo tương tác hoạt động
                    setTimeout(() => {
                      modelViewer.focus();
                    }, 100);
                  }
                }}
                onMouseDown={(e) => {
                  // Đảm bảo pointer events hoạt động
                  e.stopPropagation();
                  const modelViewer = e.target;
                  if (modelViewer) {
                    modelViewer.style.cursor = 'grabbing';
                  }
                }}
                onMouseUp={(e) => {
                  const modelViewer = e.target;
                  if (modelViewer) {
                    modelViewer.style.cursor = 'grab';
                  }
                }}
                onTouchStart={(e) => {
                  // Đảm bảo touch events hoạt động
                  e.stopPropagation();
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TextbookImagesSection;

