import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Atom,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/hooks/useAuth';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [direction, setDirection] = useState(1);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [slideKey, setSlideKey] = useState(0); // Key để reset animation khi chuyển slide

  const nextSlide = () => {
    setIsVisible(false);
    setDirection(1);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setSlideKey((prev) => prev + 1); // Reset animation key
      setIsVisible(true);
    }, 400);
  };

  const goToSlide = (index) => {
    setIsVisible(false);
    setDirection(index > currentSlide ? 1 : -1);
    setTimeout(() => {
      setCurrentSlide(index);
      setSlideKey((prev) => prev + 1); // Reset animation key
      setIsVisible(true);
    }, 400);
  };

  const slides = useMemo(() => [
    {
      icon: Atom,
      title: 'Chào mừng đến AR Chemistry',
      subtitle: 'Công nghệ AR tiên tiến',
      description: 'Khám phá thế giới hóa học một cách trực quan và sinh động với công nghệ thực tế ảo tăng cường',
      features: [
        { icon: '/archanthuc.svg', text: 'Trải nghiệm AR chân thực' },
        { icon: '/xulinhanhchong.svg', text: 'Tốc độ xử lý nhanh chóng' },
        { icon: '/3dsongdong.svg', text: 'Mô hình 3D sống động' },
      ],
      buttonText: 'Tìm hiểu ngay',
    },
    {
      icon: BookOpen,
      title: 'Học Tập Trực Quan',
      subtitle: 'Phương pháp học mới',
      description: 'Quét hình ảnh từ sách giáo khoa để xem mô hình 3D tương tác, giúp bạn hiểu sâu hơn về cấu trúc phân tử',
      cards: [
        {
          icon: '/quetnhanh.svg',
          title: 'Quét nhanh',
          description: 'Chỉ cần quét hình ảnh từ SGK',
        },
        {
          icon: '/xem3d.svg',
          title: 'Xem 3D',
          description: 'Mô hình hiển thị ngay lập tức',
        },
        {
          icon: '/hochieuqua.svg',
          title: 'Học hiệu quả',
          description: 'Hiểu rõ cấu trúc phân tử',
        },
      ],
      buttonText: 'Trải nghiệm ngay',
    },
    {
      icon: Camera,
      title: 'Bắt Đầu Ngay',
      subtitle: 'Sẵn sàng khám phá?',
      description: isAuthenticated 
        ? 'Chào mừng trở lại! Hãy tiếp tục khám phá thế giới hóa học với AR Chemistry'
        : 'Hãy bắt đầu trải nghiệm AR Chemistry ngay bây giờ. Quét và khám phá thế giới hóa học đầy màu sắc',
      highlight: isAuthenticated
        ? 'Chào mừng bạn trở lại! Nhấn để vào ứng dụng'
        : 'Chỉ cần một cú click để bắt đầu hành trình khám phá của bạn',
      buttonText: isAuthenticated ? 'Vào ứng dụng' : 'Bắt đầu ngay',
      buttonAction: () => navigate(isAuthenticated ? '/ar?tab=overview' : '/login'),
    },
  ], [isAuthenticated, navigate]);

  useEffect(() => {
    setIsVisible(true);
  }, [currentSlide]);

  // Hiệu ứng fade-in khi trang được load
  useEffect(() => {
    setPageLoaded(false);
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const current = slides[currentSlide];

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden bg-white transition-opacity duration-700 ease-out ${
      pageLoaded ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background Decorative Elements - Blue Theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Logo Header */}
      <div className={`relative z-10 flex justify-center pt-6 sm:pt-8 transition-all duration-700 ease-out delay-200 ${
        pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <img
          src="/logorutgon.svg"
          alt="AR Chemistry Logo"
          className="h-12 w-auto sm:h-16"
        />
      </div>

      {/* Slide Content */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <div
          className={`flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 transition-all duration-500 ease-in-out ${
            isVisible && pageLoaded
              ? 'opacity-100 translate-x-0'
              : direction === 1 || !pageLoaded
                ? 'opacity-0 translate-x-full'
                : 'opacity-0 -translate-x-full'
          }`}
        >
          <div className="w-full max-w-md space-y-6 sm:space-y-8 pb-32 sm:pb-36">
            {/* Title Section */}
            <div 
              key={`title-${slideKey}`}
              className="space-y-3 text-center animate-slide-in-right"
              style={{
                animationDelay: '0ms',
                animationFillMode: 'both',
              }}
            >
              <p className="text-sm font-medium uppercase tracking-wider text-blue-600">
                {current.subtitle}
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
                {current.title}
              </h1>
              <p className="mx-auto max-w-sm text-base leading-relaxed text-gray-600">
                {current.description}
              </p>
            </div>

            {/* Content Section - Different for each slide */}
            <div className="space-y-6">
              {/* Slide 0: Features List */}
              {currentSlide === 0 && current.features && (
                <div className="space-y-4">
                  {current.features.map((feature, index) => {
                    return (
                      <div
                        key={`feature-${slideKey}-${index}`}
                        className={`flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 animate-slide-in-right`}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                        <img 
                          src={feature.icon} 
                          alt={feature.text}
                          className="h-16 w-16 shrink-0 object-contain"
                        />
                        <p className="text-base font-medium text-gray-900">{feature.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Slide 1: Feature Cards */}
              {currentSlide === 1 && current.cards && (
                <div className="grid gap-4">
                  {current.cards.map((card, index) => {
                    return (
                      <div
                        key={`card-${slideKey}-${index}`}
                        className={`rounded-2xl border border-blue-100 bg-white p-5 shadow-sm animate-slide-in-right`}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <img 
                            src={card.icon} 
                            alt={card.title}
                            className="h-9 w-9 shrink-0 object-contain"
                          />
                          <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className={`fixed inset-x-0 bottom-0 z-20 bg-white px-4 py-4 sm:px-6 sm:py-6 transition-all duration-700 ease-out delay-300 ${
          pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="mx-auto w-full max-w-md space-y-3 sm:space-y-4">
            {/* Next Button */}
            <Button
              size="lg"
              className="h-14 w-full gap-2 bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-200"
              onClick={current.buttonAction || nextSlide}
            >
              {current.buttonText}
              {currentSlide < 2 && (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>

            {/* Slide Indicators */}
            <div className="flex items-center justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-8 bg-blue-600 shadow-lg shadow-blue-200'
                      : 'w-2 bg-gray-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
