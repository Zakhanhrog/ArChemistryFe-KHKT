import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const items = [
  { key: 'explore', label: 'Khám phá', icon: null, iconSrc: '/icon/khampha.svg' },
  { key: 'materials', label: 'Học liệu', icon: null, iconSrc: '/icon/nguyento.svg' },
  { key: 'scan', label: 'Quét AR', icon: null },
  { key: 'ai-assistant', label: 'Trợ lý AI', icon: null, iconSrc: '/icon/troliai.svg' },
  { key: 'profile', label: 'Cá nhân', icon: null, iconSrc: '/icon/canhan.svg' },
];

function NavButton({ label, icon: Icon, iconSrc, active, onClick }) {

  return (
    <div className="relative flex-1">
      {/* Vạch ở mép trên khi active - trùng mép trên của nav */}
      {active && (
        <div className="absolute -top-[0.375rem] left-0 right-0 h-0.5 rounded-full animate-scale-x z-10" style={{ backgroundColor: '#1689E4' }} />
      )}
    <button
      type="button"
      onClick={onClick}
      className={cn(
          'w-full flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[0.7rem] sm:text-[0.75rem] font-medium transition-all duration-200',
        active 
            ? 'font-semibold scale-105' 
            : 'text-gray-500'
      )}
      style={active ? { color: '#1689E4' } : {}}
    >
      {iconSrc ? (
        <div className="flex items-center justify-center">
          <img
            src={iconSrc} 
            alt={label}
            className={cn(
              'h-6 w-6 transition-all duration-200', 
              active ? 'scale-110 opacity-100' : 'opacity-50'
            )}
          />
        </div>
      ) : (
      <Icon 
        className={cn(
        'h-6 w-6 transition-all duration-200', 
          active ? 'scale-110 opacity-100' : 'text-gray-500 opacity-50'
        )}
        style={active ? { color: '#1689E4' } : {}}
      />
      )}
      <span className="truncate">{label}</span>
    </button>
    </div>
  );
}

function ScanButton({ active, onClick }) {
  const [showFirstScanText, setShowFirstScanText] = useState(true);

  useEffect(() => {
    const scanTextInterval = setInterval(() => {
      setShowFirstScanText(prev => !prev);
    }, 3500);
    return () => clearInterval(scanTextInterval);
  }, []);

  return (
    <div className="flex-1 flex justify-center relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          '-mt-7 z-10 flex flex-col items-center transition-all duration-200',
          active && 'scale-105'
        )}
      >
        <div 
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center p-2 transition-all duration-200 shadow-lg border-2 border-white',
            active ? 'shadow-xl' : 'hover:scale-105'
          )}
          style={{ backgroundColor: active ? '#1373C4' : '#1689E4' }}
          onMouseEnter={(e) => !active && (e.currentTarget.style.backgroundColor = '#1373C4')}
          onMouseLeave={(e) => !active && (e.currentTarget.style.backgroundColor = '#1689E4')}
        >
          <img 
            src="/icon/aricon.svg" 
            alt="AR Scan" 
            className="h-9 w-9 animate-gentle-pulse"
          />
        </div>
        <div className="relative h-4 w-24 text-center overflow-hidden mt-1.5">
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
            showFirstScanText ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          )}>
            <span className="text-[11px] font-semibold" style={{ color: '#1689E4' }}>Quét AR</span>
          </div>
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
            showFirstScanText ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
          )}>
            <span 
              className={cn(
                "text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-transform duration-300 ease-out",
              showFirstScanText ? "scale-0" : "scale-100 delay-200"
              )}
              style={{ color: '#1373C4', backgroundColor: 'rgba(22, 137, 228, 0.1)' }}
            >
              ChemAr
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

function BottomNav({ activeKey = 'scan', onChange }) {

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-lg shadow-gray-100">
      <div className="container flex items-stretch gap-1 px-1 sm:gap-1.5 sm:px-1.5 py-1.5">
        {items.map(({ key, ...itemProps }) => {
          // Render special scan button in the middle
          if (key === 'scan') {
            return (
              <ScanButton
                key={key}
                active={key === activeKey}
                onClick={() => onChange?.(key)}
              />
            );
          }
          
          // Render normal buttons
          return (
            <NavButton
              key={key}
              {...itemProps}
              active={key === activeKey}
              onClick={() => onChange?.(key)}
            />
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;

