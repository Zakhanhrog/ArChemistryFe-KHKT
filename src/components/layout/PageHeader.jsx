import { Menu, Bell } from 'lucide-react';

function PageHeader({ onMenuClick, onNotificationClick }) {
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
          <img
            src="/chemar.svg"
            alt="CHEMAR"
            className="h-6 w-auto sm:h-8"
          />
        </div>

        {/* Nút bên phải */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Nút thông báo */}
          <button
            type="button"
            onClick={onNotificationClick || (() => {})}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            aria-label="Thông báo"
          >
            <Bell className="h-5 w-5 sm:h-5 sm:w-5" />
          </button>

          {/* Nút menu (3 gạch) */}
          <button
            type="button"
            onClick={onMenuClick || (() => {})}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;

