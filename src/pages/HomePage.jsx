import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Atom,
  BookOpen,
  ArrowRight,
  Bot,
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
  const [isFadingOut, setIsFadingOut] = useState(false); // State để track fade out khi chuyển trang
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Hàm để fade out trước khi navigate
  const handleNavigate = (navigateFn) => {
    setIsFadingOut(true);
    setTimeout(() => {
      navigateFn();
    }, 400); // Đợi fade out hoàn thành (400ms)
  };

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
      title: 'Chào mừng đến với',
      titleBrand: 'chemar.',
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
      icon: Bot,
      title: 'Trợ Lý AI Thông Minh',
      subtitle: 'Học tập với AI',
      description: 'Trợ lý AI chuyên về hóa học luôn sẵn sàng giải đáp mọi thắc mắc, giúp bạn học tập hiệu quả hơn',
      cards: [
        {
          icon: '/icon/gtkhainiem.svg',
          title: 'Giải thích khái niệm',
          description: 'Hiểu rõ các khái niệm hóa học phức tạp',
        },
        {
          icon: '/icon/tcthongtin.svg',
          title: 'Tra cứu thông tin',
          description: 'Tìm hiểu về nguyên tố và phân tử',
        },
        {
          icon: '/icon/tlcauhoi.svg',
          title: 'Trả lời câu hỏi',
          description: 'Giải đáp mọi thắc mắc về hóa học',
        },
      ],
      buttonText: 'Khám phá AI',
      buttonAction: () => handleNavigate(() => navigate(isAuthenticated ? '/ar?tab=ai-assistant' : '/welcome')),
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
      buttonAction: () => handleNavigate(() => navigate(isAuthenticated ? '/ar?tab=explore' : '/welcome')),
    },
  ], [isAuthenticated, navigate]);

  useEffect(() => {
    setIsVisible(true);
  }, [currentSlide]);

  // Redirect nếu đã đăng nhập - không cho quay lại trang giới thiệu
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ar?tab=explore', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Hiệu ứng fade-in khi trang được load
  useEffect(() => {
    setPageLoaded(false);
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Khởi tạo Vanta Clouds background
  useEffect(() => {
    let mounted = true;
    
    const initVanta = () => {
      if (mounted && typeof window !== 'undefined' && window.VANTA && vantaRef.current) {
        vantaEffect.current = window.VANTA.CLOUDS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          skyColor: 0x50bbed,
          speed: 0.90,
        });
      }
    };

    // Kiểm tra nếu VANTA đã sẵn sàng
    if (typeof window !== 'undefined' && window.VANTA) {
      initVanta();
    } else {
      // Đợi scripts load xong
      const checkVanta = setInterval(() => {
        if (typeof window !== 'undefined' && window.VANTA) {
          clearInterval(checkVanta);
          initVanta();
        }
      }, 100);

      // Timeout sau 5 giây nếu scripts không load
      setTimeout(() => {
        clearInterval(checkVanta);
      }, 5000);
    }

    return () => {
      mounted = false;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const current = slides[currentSlide];

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden bg-white transition-opacity duration-[400ms] ease-out ${
      pageLoaded && !isFadingOut ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Vanta Clouds Background */}
      <div ref={vantaRef} className="absolute inset-0 z-0" />

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
              <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">
                {current.title}
              </h1>
                {current.titleBrand && (
                  <h1 
                    className="text-4xl font-normal tracking-tight sm:text-5xl bg-clip-text text-transparent leading-none animate-gradient"
                    style={{ 
                      fontFamily: "'Momo Trust Display', sans-serif", 
                      backgroundImage: 'linear-gradient(90deg, #2563eb, #27B0DA, #8b5cf6, #ec4899, #2563eb)',
                      backgroundSize: '200% 100%'
                    }}
                  >
                    {current.titleBrand}
                  </h1>
                )}
              </div>
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
                        className={`flex items-center gap-4 rounded-2xl border border-white/20 bg-white/25 backdrop-blur-2xl shadow-lg p-4 animate-slide-in-right`}
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

              {/* Slide 1: Feature Cards - Style giống slide đầu tiên */}
              {currentSlide === 1 && current.cards && (
                <div className="space-y-4">
                  {current.cards.map((card, index) => {
                    return (
                      <div
                        key={`card-${slideKey}-${index}`}
                        className={`flex items-center gap-4 rounded-2xl border border-white/20 bg-white/25 backdrop-blur-2xl shadow-lg p-4 animate-slide-in-right`}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                        <img 
                          src={card.icon} 
                          alt={card.title}
                          className="h-16 w-16 shrink-0 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-base font-medium text-gray-900">{card.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Slide 2: AI Assistant Cards - Style giống slide đầu tiên */}
              {currentSlide === 2 && current.cards && (
                <div className="space-y-4">
                  {current.cards.map((card, index) => {
                    return (
                      <div
                        key={`card-${slideKey}-${index}`}
                        className={`flex items-center gap-4 rounded-2xl border border-white/20 bg-white/25 backdrop-blur-2xl shadow-lg p-4 animate-slide-in-right`}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                          <img 
                            src={card.icon} 
                            alt={card.title}
                          className="h-16 w-16 shrink-0 object-contain"
                          />
                        <div className="flex-1">
                          <p className="text-base font-medium text-gray-900">{card.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className={`fixed inset-x-0 bottom-0 z-20 px-4 py-4 sm:px-6 sm:py-6 transition-all duration-700 ease-out delay-300 ${
          pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="mx-auto w-full max-w-md space-y-3 sm:space-y-4">
            {/* Next Button */}
            <Button
              size="lg"
              className="h-14 w-full gap-2 text-base font-semibold text-white shadow-lg"
              style={{ backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' }}
              onClick={() => {
                if (currentSlide === slides.length - 1 && current.buttonAction) {
                  handleNavigate(current.buttonAction);
                } else {
                  nextSlide();
                }
              }}
            >
              {currentSlide === slides.length - 1 ? 'Tìm hiểu ngay' : 'Tiếp theo'}
              {currentSlide < slides.length - 1 && (
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
                      ? 'w-8 shadow-lg'
                      : 'w-2 bg-gray-300'
                  }`}
                  style={index === currentSlide ? { backgroundColor: '#1689E4', boxShadow: '0 10px 15px -3px rgba(22, 137, 228, 0.3)' } : {}}
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
