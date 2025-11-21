import { useState, useEffect } from 'react';
import { Home, History, Camera, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@/hooks/useAuth';
import { normalizeImageUrl } from '@/utils/imageUrl';

const items = [
  { key: 'overview', label: 'Trang chủ', icon: Home },
  { key: 'history', label: 'Đã quét', icon: History },
  { key: 'scan', label: 'Quét ngay', icon: Camera },
  { key: 'library', label: 'Thư viện', icon: BookOpen },
  { key: 'profile', label: 'Cá nhân', icon: User },
];

function NavButton({ label, icon: Icon, active, onClick, avatarUrl, isProfile }) {
  const [avatarError, setAvatarError] = useState(false);

  // Reset error when avatarUrl changes
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[0.75rem] sm:text-[0.8rem] font-medium transition',
        active 
          ? 'text-blue-600 font-semibold bg-blue-50' 
          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50',
      )}
    >
      {isProfile && avatarUrl && !avatarError ? (
        <div className={cn(
          'h-5 w-5 rounded-full overflow-hidden border-2 flex-shrink-0',
          active ? 'border-blue-600' : 'border-gray-300'
        )}>
          <img
            src={normalizeImageUrl(avatarUrl) || ''}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => {
              setAvatarError(true);
            }}
            onLoad={() => {
              setAvatarError(false);
            }}
          />
        </div>
      ) : (
      <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-500')} />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function BottomNav({ activeKey = 'scan', onChange }) {
  const { user } = useAuthStore();
  const avatarUrl = user?.avatarUrl;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-lg shadow-gray-100">
      <div className="container flex items-stretch gap-1 px-1 sm:gap-1.5 sm:px-1.5 py-1.5">
        {items.map(({ key, ...itemProps }) => (
          <NavButton
            key={key}
            {...itemProps}
            active={key === activeKey}
            onClick={() => onChange?.(key)}
            avatarUrl={key === 'profile' ? avatarUrl : null}
            isProfile={key === 'profile'}
          />
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;

