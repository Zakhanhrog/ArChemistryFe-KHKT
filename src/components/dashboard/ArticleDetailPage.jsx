import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getArticleById, getActiveArticles } from '@/services/articleService';

function ArticleDetailPage({ articleId, onBack, onNext }) {
  const [article, setArticle] = useState(null);
  const [nextArticle, setNextArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allArticles, setAllArticles] = useState([]);

  useEffect(() => {
    loadArticle();
    loadAllArticles();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await getArticleById(articleId);
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllArticles = async () => {
    try {
      const data = await getActiveArticles();
      setAllArticles(data);
      
      // Find next article
      const currentIndex = data.findIndex(a => a.id === articleId);
      if (currentIndex >= 0 && currentIndex < data.length - 1) {
        setNextArticle(data[currentIndex + 1]);
      } else {
        setNextArticle(null);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy bài viết</p>
      </div>
    );
  }

  const hasNext = nextArticle !== undefined && nextArticle !== null;
  // Render HTML content from Quill editor
  const renderContent = (htmlContent) => {
    return (
      <div 
        className="prose prose-lg max-w-none text-justify"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          lineHeight: '1.75',
        }}
      />
    );
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header with back button and next button */}
      <div className="sticky top-0 z-20">
        <div className="container px-4 sm:px-6 py-1 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 h-7 px-3 -ml-2 bg-blue-100/80 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Quay lại</span>
          </Button>
          {hasNext && onNext && nextArticle && (
            <Button
              variant="ghost"
              onClick={() => {
                // onNext will be handled by ExploreSection
                onNext();
              }}
              className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 h-7 px-3 -mr-2 bg-blue-100/80 backdrop-blur-sm rounded-full max-w-[200px]"
            >
              <span className="text-sm truncate">Bài tiếp theo</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </Button>
          )}
        </div>
      </div>

      {/* Article Content */}
      <div className="container px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
        {/* Article Header */}
        <div className="mb-8">
          {article.imageUrl && (
            <div className="mb-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-auto rounded-lg object-cover max-h-96"
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {article.isAiGenerated && (
              <span className="text-sm font-medium px-3 py-1 rounded-full animate-gradient-flow text-white shadow-md hover:shadow-lg transition-shadow">
                AI đề xuất
              </span>
            )}
            {article.category && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {article.category}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
        </div>

        {/* Article Body */}
        <div className="text-gray-800 leading-relaxed">
          {renderContent(article.content)}
        </div>
      </div>
    </div>
  );
}

export default ArticleDetailPage;

