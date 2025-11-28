import { useNavigate } from 'react-router-dom';

function PageHeader({ onMenuClick, onNotificationClick }) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
      <div className="container flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
        {/* Logo bên trái */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img
            src="/logorutgon.svg"
            alt="AR Chemistry Logo"
            className="h-7 w-auto sm:h-8"
          />
          <span 
            className="h-7 sm:h-8 flex items-center font-normal bg-clip-text text-transparent leading-none"
            style={{ 
              fontFamily: "'Momo Trust Display', sans-serif", 
              fontSize: '1.77rem',
              backgroundImage: 'linear-gradient(to right, #2563eb, #27B0DA)'
            }}
          >
            chemar.
          </span>
        </div>

        {/* Help Icon */}
        <div className="flex items-center">
          <button
            onClick={() => navigate('/help')}
            className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center transition-opacity hover:opacity-70"
            title="Hướng dẫn sử dụng"
          >
            <img 
              src="/icon/help.svg" 
              alt="Hướng dẫn"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;

