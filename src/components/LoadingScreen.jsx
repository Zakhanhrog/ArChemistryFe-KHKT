import { useState, useEffect } from 'react';

function LoadingScreen({ onLoadingComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hiển thị loading screen trong 5 giây
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Đợi animation fade out hoàn thành trước khi gọi callback
      setTimeout(() => {
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <video
          src="/logostart.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="h-64 w-64 sm:h-80 sm:w-80 object-contain"
        />
      </div>
    </div>
  );
}

export default LoadingScreen;

