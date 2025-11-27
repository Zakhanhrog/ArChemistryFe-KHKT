import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTextbookPdfUrl } from '@/services/textbookService';
import TextbookImagesSection from './TextbookImagesSection';

// Component for rendering a single page in grid view
function GridPageItem({ pageData, onClick }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || rendered || !pageData.page) return;

    const renderPage = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Get device pixel ratio from pageData or calculate
        const devicePixelRatio = pageData.devicePixelRatio || window.devicePixelRatio || 1;
        
        // Calculate display dimensions (smaller for display)
        const displayWidth = pageData.viewport.width / devicePixelRatio;
        const displayHeight = pageData.viewport.height / devicePixelRatio;
        
        // Set canvas size in actual pixels (for rendering at high resolution)
        canvas.width = pageData.viewport.width;
        canvas.height = pageData.viewport.height;
        
        // Set canvas size in CSS pixels (for display - smaller to fit screen)
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Cancel any previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Create new render task
        const renderTask = pageData.page.render({
          canvasContext: context,
          viewport: pageData.viewport,
        });
        
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (canvasRef.current) {
          setRendered(true);
        }
      } catch (err) {
        // Ignore cancellation errors
        if (err.name !== 'RenderingCancelledException') {
          console.error(`Error rendering grid page ${pageData.pageNum}:`, err);
        }
      } finally {
        renderTaskRef.current = null;
      }
    };

    renderPage();

    // Cleanup: cancel render on unmount
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pageData, rendered]);

  return (
    <div
      onClick={onClick}
      className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-400 flex flex-col"
    >
      <div className="px-2 py-1 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <p className="text-xs text-gray-600 text-center font-medium">
          Trang {pageData.pageNum}
        </p>
      </div>
      <div className="flex justify-center items-start bg-white overflow-hidden flex-shrink-0" style={{ maxHeight: '400px' }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-auto"
          style={{ display: 'block', maxHeight: '400px', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}

function PDFViewer({ textbookId, textbookName, bookSetName, grade, onClose }) {
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [gridPages, setGridPages] = useState([]); // Store rendered page canvases for grid view
  const [renderingPages, setRenderingPages] = useState(new Set());
  const [loadedPagesCount, setLoadedPagesCount] = useState(20); // Number of pages loaded so far
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const pageInputRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const renderCancelRef = useRef(false);
  const currentRenderIdRef = useRef(0);
  const gridCanvasRefs = useRef({}); // Store refs for grid page canvases
  const renderTasksRef = useRef({}); // Store render tasks to cancel if needed

  // Display title as "SGK Hoá học x" where x is the grade
  const displayName = grade ? `SGK Hoá học ${grade}` : (() => {
    if (bookSetName) {
      // Remove "Bộ sách" prefix if present
      return bookSetName.replace(/^Bộ sách\s+/, '');
    }
    // Try to extract from textbookName (format: "Subject Grade - Book Set")
    if (textbookName && textbookName.includes(' - ')) {
      const parts = textbookName.split(' - ');
      return parts[parts.length - 1]; // Get last part after " - "
    }
    return textbookName;
  })();

  useEffect(() => {
    // Dynamically import pdfjs-dist
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker - check domain to determine environment
        // Production domain: chemar.ai.vn
        const hostname = window.location.hostname;
        const isProduction = hostname === 'chemar.ai.vn' || hostname.includes('chemar.ai.vn');
        
        if (isProduction) {
          // Production: use unpkg CDN (reliable for .mjs files)
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs';
        } else {
          // Development: use local file from public folder
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }

        // Get PDF URL
        const pdfUrl = getTextbookPdfUrl(textbookId);

        // Load PDF
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
        });

        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNumber(1);
        setLoading(false);

        // Render first page
        if (canvasRef.current) {
          renderPage(pdf, 1);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Không thể tải PDF. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [textbookId]);

  const renderPage = async (pdf, pageNum) => {
    // Generate unique ID for this render
    const renderId = ++currentRenderIdRef.current;
    
    // Cancel previous render
    renderCancelRef.current = true;
    
    // Small delay to allow previous render to check cancel flag
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Reset cancel flag for this render
    renderCancelRef.current = false;
    
    try {
      // Check if canvas still exists
      if (!canvasRef.current || currentRenderIdRef.current !== renderId) {
        return;
      }
      
      setRendering(true);
      
      const page = await pdf.getPage(pageNum);
      
      // Check if this render was cancelled or superseded
      if (renderCancelRef.current || currentRenderIdRef.current !== renderId || !canvasRef.current) {
        setRendering(false);
        return;
      }
      
      const canvas = canvasRef.current;
      if (!canvas) {
        setRendering(false);
        return;
      }
      
      const context = canvas.getContext('2d');
      if (!context) {
        setRendering(false);
        return;
      }
      
      // Get device pixel ratio for high-DPI displays (Retina, etc.)
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Calculate scale based on container width (responsive)
      const containerWidth = window.innerWidth - 32; // padding
      const baseViewport = page.getViewport({ scale: 1.0 });
      
      // Base scale for display size (increased for better quality)
      const displayScale = Math.min(containerWidth / baseViewport.width, 3.0);
      
      // Render at higher resolution using device pixel ratio for crisp rendering
      const renderScale = displayScale * devicePixelRatio;
      const renderViewport = page.getViewport({ scale: renderScale });
      
      // Check again before modifying canvas
      if (renderCancelRef.current || currentRenderIdRef.current !== renderId || !canvasRef.current) {
        setRendering(false);
        return;
      }
      
      // Set canvas size in actual pixels (for rendering at high resolution)
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      
      // Set canvas size in CSS pixels (for display - smaller to fit screen)
      canvas.style.width = `${renderViewport.width / devicePixelRatio}px`;
      canvas.style.height = `${renderViewport.height / devicePixelRatio}px`;

      const renderContext = {
        canvasContext: context,
        viewport: renderViewport,
      };

      await page.render(renderContext).promise;
      
      // Final check before completing
      if (renderCancelRef.current || currentRenderIdRef.current !== renderId) {
        setRendering(false);
        return;
      }
      
      setRendering(false);
    } catch (err) {
      if (renderCancelRef.current || currentRenderIdRef.current !== renderId) {
        // Render was cancelled, ignore error
        setRendering(false);
        return;
      }
      console.error('Error rendering page:', err);
      setError('Không thể hiển thị trang PDF.');
      setRendering(false);
    }
  };

  useEffect(() => {
    if (pdfRef.current && pageNumber) {
      renderPage(pdfRef.current, pageNumber);
    }
    
    // Cleanup: cancel render when component unmounts or pageNumber changes
    return () => {
      renderCancelRef.current = true;
    };
  }, [pageNumber]);

  const goToPrevPage = () => {
    if (pageNumber > 1 && !rendering) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages && !rendering) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handlePageInputClick = () => {
    if (!rendering && numPages) {
      setIsEditingPage(true);
      setPageInputValue(pageNumber.toString());
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPageInputValue(value);
    }
  };

  const handlePageInputBlur = () => {
    goToPageFromInput();
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToPageFromInput();
    } else if (e.key === 'Escape') {
      setIsEditingPage(false);
      setPageInputValue('');
    }
  };

  const goToPageFromInput = () => {
    if (!numPages) return;
    
    const pageNum = parseInt(pageInputValue);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setPageNumber(pageNum);
    }
    setIsEditingPage(false);
    setPageInputValue('');
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingPage && pageInputRef.current) {
      pageInputRef.current.focus();
      pageInputRef.current.select();
    }
  }, [isEditingPage]);

  const handlePageClick = (pageNum) => {
    setPageNumber(pageNum);
    setIsGridView(false);
  };

  // Render pages for grid view (load in batches)
  const renderPagesForGrid = async (startPage = 1, endPage = null) => {
    if (!pdfRef.current || !numPages) return;

    const maxPage = endPage || Math.min(startPage + 19, numPages); // Load 20 pages at a time
    setIsLoadingMore(true);
    const pages = [];

    for (let i = startPage; i <= maxPage; i++) {
      setRenderingPages(prev => new Set(prev).add(i));
      try {
        const page = await pdfRef.current.getPage(i);
        const baseViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = (window.innerWidth - 48) / 2; // 2 columns with gap
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        // Calculate display scale for container size
        const displayScale = Math.min(containerWidth / baseViewport.width, 1.5);
        
        // Render at higher resolution using device pixel ratio for crisp rendering
        const renderScale = displayScale * devicePixelRatio;
        const viewport = page.getViewport({ scale: renderScale });

        // Store page data for rendering
        pages.push({
          pageNum: i,
          page: page,
          viewport: viewport,
          width: viewport.width / devicePixelRatio, // Display width
          height: viewport.height / devicePixelRatio, // Display height
          devicePixelRatio: devicePixelRatio,
        });
      } catch (err) {
        console.error(`Error loading page ${i}:`, err);
      } finally {
        setRenderingPages(prev => {
          const newSet = new Set(prev);
          newSet.delete(i);
          return newSet;
        });
      }
    }

    setGridPages(prev => [...prev, ...pages]);
    setLoadedPagesCount(maxPage);
    setIsLoadingMore(false);
  };

  const loadMorePages = () => {
    if (!isLoadingMore && loadedPagesCount < numPages) {
      const nextPage = loadedPagesCount + 1;
      const endPage = Math.min(nextPage + 19, numPages);
      renderPagesForGrid(nextPage, endPage);
    }
  };

  useEffect(() => {
    if (isGridView && pdfRef.current && numPages) {
      // Reset when switching to grid view
      setGridPages([]);
      setLoadedPagesCount(20);
      // Load first 20 pages
      renderPagesForGrid(1, Math.min(20, numPages));
    } else {
      // Reset when switching away from grid view
      setGridPages([]);
      setLoadedPagesCount(20);
    }
  }, [isGridView, numPages]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </Button>
          <div className="h-5 w-px bg-gray-300" />
          <h2 className="text-sm font-bold text-gray-900 truncate">
            {displayName}
          </h2>
        </div>
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="flex items-center gap-2 ml-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
          title={isGridView ? "Xem từng trang" : "Xem dạng lưới"}
        >
          {isGridView ? (
            <>
              <img src="/icon/iconpage.svg" alt="Trang đơn" className="h-7 w-7" />
              <span className="hidden sm:inline text-sm">Trang đơn</span>
            </>
          ) : (
            <>
              <img src="/icon/iconluoi.svg" alt="Lưới" className="h-7 w-7" />
              <span className="hidden sm:inline text-sm">Lưới</span>
            </>
          )}
        </button>
      </div>

      {/* Grid View */}
      {isGridView ? (
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {renderingPages.size > 0 && (
            <div className="text-center py-4 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Đang tải {renderingPages.size} trang...</p>
            </div>
          )}
          {gridPages.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
                {gridPages.map((pageData) => (
                  <GridPageItem
                    key={pageData.pageNum}
                    pageData={pageData}
                    onClick={() => handlePageClick(pageData.pageNum)}
                  />
                ))}
              </div>
              {loadedPagesCount < numPages && (
                <div className="flex justify-center mt-6 pb-4">
                  <Button
                    onClick={loadMorePages}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <span>Xem thêm</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-200 flex justify-center items-start pt-4">
        <div className="bg-white shadow-lg">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto block"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevPage}
          disabled={pageNumber <= 1 || rendering}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Trang trước
        </Button>
            {isEditingPage ? (
              <div className="flex items-center gap-1">
                <input
                  ref={pageInputRef}
                  type="text"
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                  className="w-12 px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={pageNumber.toString()}
                />
                <span className="text-sm text-gray-600 font-medium">/ {numPages}</span>
              </div>
            ) : (
              <div 
                className="text-sm text-gray-600 font-medium cursor-pointer hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                onClick={handlePageInputClick}
                title="Click để nhập số trang"
              >
          {pageNumber} / {numPages}
        </div>
            )}
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={pageNumber >= numPages || rendering}
          className="flex items-center gap-2"
        >
          Trang sau
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Textbook Images Section */}
      <TextbookImagesSection textbookId={textbookId} />
        </>
      )}
    </div>
  );
}

export default PDFViewer;

