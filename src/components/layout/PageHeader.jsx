import { useState } from 'react';
import { User } from 'lucide-react';
import useAuthStore from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/imageUrl';

function PageHeader({ onMenuClick, onNotificationClick }) {
  const { user } = useAuthStore();
  const [avatarError, setAvatarError] = useState(false);

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

        {/* Avatar và tên hiển thị bên phải */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span 
              className="text-sm sm:text-base font-medium text-gray-900 hidden sm:block"
              style={{ fontFamily: "'Momo Signature', sans-serif", fontWeight: 500 }}
            >
              {user?.name || 'Người dùng'}
            </span>
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-100 ring-2 ring-blue-200 overflow-hidden flex items-center justify-center">
              {user?.avatarUrl && !avatarError ? (
                <img
                  src={normalizeImageUrl(user.avatarUrl) || ''}
                  alt={user?.name || 'Avatar'}
                  className="h-full w-full object-cover"
                  crossOrigin="anonymous"
                  onError={() => {
                    setAvatarError(true);
                  }}
                  onLoad={() => {
                    setAvatarError(false);
                  }}
                />
              ) : (
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;

