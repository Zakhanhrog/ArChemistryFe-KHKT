import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, BookOpen } from 'lucide-react';
import { getTextbooks } from '@/services/textbookService';
import PDFViewer from './PDFViewer';

const BOOK_SETS = {
  canhDieu: {
    id: 'canh-dieu',
    name: 'Bộ sách Cánh Diều',
    description: 'Bộ sách giáo khoa Cánh Diều - Chương trình giáo dục phổ thông mới',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  ketNoi: {
    id: 'ket-noi',
    name: 'Kết nối tri thức',
    description: 'Bộ sách giáo khoa Kết nối tri thức với cuộc sống',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
};

const GRADES = [
  { id: 10, name: 'Lớp 10', description: 'Sách giáo khoa lớp 10' },
  { id: 11, name: 'Lớp 11', description: 'Sách giáo khoa lớp 11' },
  { id: 12, name: 'Lớp 12', description: 'Sách giáo khoa lớp 12' },
];

function MaterialsSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookSet, setSelectedBookSet] = useState(null);
  const [textbooksByGrade, setTextbooksByGrade] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTextbook, setSelectedTextbook] = useState(null);

  // Load state from URL on mount and when URL changes
  useEffect(() => {
    const bookSetId = searchParams.get('bookSet');
    const textbookId = searchParams.get('textbook');
    
    if (bookSetId) {
      const bookSet = Object.values(BOOK_SETS).find(bs => bs.id === bookSetId);
      if (bookSet && selectedBookSet?.id !== bookSet.id) {
        setSelectedBookSet(bookSet);
        
        if (textbookId) {
          // Load textbook if textbookId is in URL
          loadTextbookById(bookSet, parseInt(textbookId));
        } else {
          // Just load textbooks list
          loadTextbooksForBookSet(bookSet);
          setSelectedTextbook(null); // Clear selected textbook if not in URL
        }
      } else if (bookSet && selectedBookSet?.id === bookSet.id) {
        // Same book set, just check textbook
        if (textbookId) {
          const allTextbooks = [
            ...(textbooksByGrade[10] || []),
            ...(textbooksByGrade[11] || []),
            ...(textbooksByGrade[12] || []),
          ];
          const textbook = allTextbooks.find(tb => tb.id === parseInt(textbookId));
          if (textbook && selectedTextbook?.id !== textbook.id) {
            setSelectedTextbook(textbook);
          } else if (!textbook) {
            // Textbook not found in loaded data, load it
            loadTextbookById(bookSet, parseInt(textbookId));
          }
        } else {
          setSelectedTextbook(null); // Clear selected textbook if not in URL
        }
      }
    } else {
      // No bookSet in URL, reset state
      if (selectedBookSet) {
        setSelectedBookSet(null);
        setTextbooksByGrade({});
        setSelectedTextbook(null);
      }
    }
  }, [searchParams]);

  const loadTextbooksForBookSet = async (bookSet) => {
    setTextbooksByGrade({});
    setLoading(true);
    
    try {
      // Load textbooks for all 3 grades (10, 11, 12) at once
      const [grade10, grade11, grade12] = await Promise.all([
        getTextbooks(bookSet.id, 10).catch(() => []),
        getTextbooks(bookSet.id, 11).catch(() => []),
        getTextbooks(bookSet.id, 12).catch(() => []),
      ]);
      
      setTextbooksByGrade({
        10: grade10,
        11: grade11,
        12: grade12,
      });
    } catch (error) {
      console.error('Error loading textbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTextbookById = async (bookSet, textbookId) => {
    try {
      // Load all textbooks first to find the one we need
      const [grade10, grade11, grade12] = await Promise.all([
        getTextbooks(bookSet.id, 10).catch(() => []),
        getTextbooks(bookSet.id, 11).catch(() => []),
        getTextbooks(bookSet.id, 12).catch(() => []),
      ]);
      
      setTextbooksByGrade({
        10: grade10,
        11: grade11,
        12: grade12,
      });
      
      // Find textbook in loaded data
      const allTextbooks = [...grade10, ...grade11, ...grade12];
      const textbook = allTextbooks.find(tb => tb.id === textbookId);
      
      if (textbook) {
        setSelectedTextbook(textbook);
      }
    } catch (error) {
      console.error('Error loading textbook:', error);
    }
  };

  const handleBookSetClick = async (bookSet) => {
    setSelectedBookSet(bookSet);
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('bookSet', bookSet.id);
    newSearchParams.delete('textbook'); // Remove textbook param when changing book set
    setSearchParams(newSearchParams, { replace: true });
    
    await loadTextbooksForBookSet(bookSet);
  };

  const handleBack = () => {
    if (selectedTextbook) {
      setSelectedTextbook(null);
      // Update URL - remove textbook param, keep bookSet
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('textbook');
      setSearchParams(newSearchParams, { replace: true });
    } else {
      setSelectedBookSet(null);
      setTextbooksByGrade({});
      // Update URL - remove both params
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('bookSet');
      newSearchParams.delete('textbook');
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const handleTextbookClick = (textbook) => {
    setSelectedTextbook(textbook);
    // Update URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('textbook', textbook.id.toString());
    setSearchParams(newSearchParams, { replace: true });
  };

  // Show PDF Viewer
  if (selectedTextbook) {
    return (
      <PDFViewer
        textbookId={selectedTextbook.id}
        textbookName={selectedTextbook.name}
        bookSetName={selectedBookSet?.name || 'Kết nối tri thức'}
        grade={selectedTextbook.grade}
        onClose={() => {
          setSelectedTextbook(null);
          // Update URL - remove textbook param, keep bookSet
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('textbook');
          setSearchParams(newSearchParams, { replace: true });
        }}
      />
    );
  }

  // Show Textbooks List by Grade
  if (selectedBookSet) {
    const hasAnyTextbooks = Object.values(textbooksByGrade).some(books => books.length > 0);
    
    return (
      <div className="space-y-6">
        {/* Back button and book set name */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Chọn bộ sách</span>
          </button>
          {selectedBookSet && (
            <span className="text-sm font-semibold text-gray-900">
              Đang chọn: {selectedBookSet.name.replace(/^Bộ sách\s+/, '')}
            </span>
          )}
        </div>

        {/* Textbooks by Grade */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Đang tải sách giáo khoa...</div>
          </div>
        ) : hasAnyTextbooks ? (
          (() => {
            // Gom tất cả sách của các khối vào một mảng, hiển thị liên tục 2 quyển/1 dòng
            const allTextbooks = GRADES.flatMap((grade) => textbooksByGrade[grade.id] || []);
              
              return (
                  <div className="grid gap-4 grid-cols-2">
                {allTextbooks.map((textbook) => (
                      <Card
                        key={textbook.id}
                        className="hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-blue-300 overflow-hidden"
                        onClick={() => handleTextbookClick(textbook)}
                      >
                        <CardContent className="p-0">
                          {/* Book cover */}
                          {textbook.coverImageUrl ? (
                            <div className="aspect-[3/4] bg-gray-100">
                              <img
                                src={textbook.coverImageUrl}
                                alt={textbook.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
                              <BookOpen className={`h-16 w-16 ${selectedBookSet.textColor} opacity-50 mb-2`} />
                          <p className="text-xs text-gray-600 font-medium text-center px-3 line-clamp-2">
                            {textbook.name}
                          </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              );
          })()
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">Chưa có sách giáo khoa</p>
              <p className="text-sm text-gray-500">Sách giáo khoa sẽ xuất hiện ở đây</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Học liệu</h2>
        <p className="text-gray-600">Chọn bộ sách giáo khoa để bắt đầu học tập</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {Object.values(BOOK_SETS).map((bookSet) => (
          <Card
            key={bookSet.id}
            className={`hover:shadow-xl transition-all duration-300 cursor-pointer border ${bookSet.borderColor} group`}
            onClick={() => handleBookSetClick(bookSet)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {bookSet.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {bookSet.description}
                  </p>
                </div>
                <div className="flex items-center text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                  <span>Xem chi tiết</span>
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MaterialsSection;

