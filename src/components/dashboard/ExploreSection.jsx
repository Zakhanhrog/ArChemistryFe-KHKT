import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import ArticleDetailPage from './ArticleDetailPage';
import { getActiveArticlesPaginated, markArticleAsRead } from '@/services/articleService';
import useAuthStore from '@/hooks/useAuth';

// Hàm format thời gian relative
const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'vừa xong';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `cách đây ${diffInMinutes} phút`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `cách đây ${diffInHours} giờ`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `cách đây ${diffInDays} ngày`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `cách đây ${diffInMonths} tháng`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `cách đây ${diffInYears} năm`;
};

// Hàm strip HTML tags từ text
const stripHtmlTags = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

function ExploreSection() {
  const { isAuthenticated } = useAuthStore();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [isSliding, setIsSliding] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    loadArticles(0, true);
  }, []);

  const loadArticles = async (page = 0, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const data = await getActiveArticlesPaginated(page, pageSize);
      
      if (reset) {
        setArticles(data.articles || []);
      } else {
        setArticles(prev => [...prev, ...(data.articles || [])]);
      }
      
      setCurrentPage(data.currentPage || 0);
      setHasNext(data.hasNext || false);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNext) {
      loadArticles(currentPage + 1, false);
    }
  };

  const handleReadMore = async (articleId) => {
    // Mark article as read if authenticated and article is AI generated
    if (isAuthenticated) {
      try {
        const article = articles.find(a => a.id === articleId);
        if (article && article.isAiGenerated && !article.isRead) {
          await markArticleAsRead(articleId);
          // Update local state
          setArticles(prev => prev.map(a => 
            a.id === articleId ? { ...a, isRead: true } : a
          ));
        }
      } catch (error) {
        console.error('Error marking article as read:', error);
      }
    }
    
    setSelectedArticleId(articleId);
    // Trigger animation after state update
    requestAnimationFrame(() => {
      setIsSliding(true);
    });
  };

  const handleBack = () => {
    setIsSliding(false);
    setTimeout(() => {
      setSelectedArticleId(null);
    }, 300);
  };

  const handleNext = () => {
    const currentIndex = articles.findIndex(a => a.id === selectedArticleId);
    if (currentIndex >= 0 && currentIndex < articles.length - 1) {
      const nextArticle = articles[currentIndex + 1];
      setIsSliding(false);
      setTimeout(() => {
        setSelectedArticleId(nextArticle.id);
        requestAnimationFrame(() => {
          setIsSliding(true);
        });
      }, 300);
    }
  };

  // Nếu đang hiển thị trang chi tiết
  if (selectedArticleId) {
    return (
      <>
        <div 
          className={`fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out ${
            isSliding ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ 
            top: '64px',
            bottom: '80px',
            overflowY: 'auto'
          }}
        >
          <ArticleDetailPage 
            articleId={selectedArticleId} 
            onBack={handleBack}
            onNext={handleNext}
          />
        </div>
      </>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Khám phá Hóa học</h2>
        <p className="text-gray-600">Những bài viết hay về hóa học dành cho bạn</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Đang tải bài viết...</p>
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          const isUnread = article.isAiGenerated && !article.isRead;
          return (
            <Card 
              key={article.id} 
              className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
                isUnread 
                  ? 'border-2 border-blue-600 shadow-[0_0_0_3px_rgba(37,99,235,0.1)] hover:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] animate-pulse-subtle' 
                  : 'border border-gray-200'
              }`}
            >
              <CardHeader className="pb-3 pt-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {article.isAiGenerated && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full animate-gradient-flow text-white shadow-[0_0_8px_rgba(139,92,246,0.4),0_0_12px_rgba(168,85,247,0.3)] hover:shadow-[0_0_12px_rgba(139,92,246,0.5),0_0_16px_rgba(168,85,247,0.4)] transition-shadow duration-300">
                        AI đề xuất
                      </span>
                      )}
                      {article.category && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {article.category}
                      </span>
                      )}
                      {article.createdAt && (
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(article.createdAt)}
                      </span>
                      )}
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </CardTitle>
                    {article.description && (
                <CardDescription className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {stripHtmlTags(article.description)}
                </CardDescription>
                    )}
                    <div className="flex justify-end">
                    <button 
                      onClick={() => handleReadMore(article.id)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                  Đọc thêm →
                </button>
                    </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {articles.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Chưa có bài viết</p>
            <p className="text-sm text-gray-500">Các bài viết sẽ xuất hiện ở đây</p>
          </CardContent>
        </Card>
      )}

      {hasNext && articles.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[120px] gap-2"
            style={{ backgroundColor: '#1689E4' }}
          >
            {loadingMore ? 'Đang tải...' : (
              <>
                Xem thêm
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
        </>
      )}
    </section>
  );
}

export default ExploreSection;

