import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ARViewer from '@/components/ARViewer.jsx';
import PageHeader from '@/components/layout/PageHeader.jsx';
import BottomNav from '@/components/layout/BottomNav.jsx';
import OverviewSection from '@/components/dashboard/OverviewSection.jsx';
import HistorySection from '@/components/dashboard/HistorySection.jsx';
import LibrarySection from '@/components/dashboard/LibrarySection.jsx';
import ProfileSection from '@/components/dashboard/ProfileSection.jsx';
import useAuthStore from '@/hooks/useAuth';

function ARPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('scan');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else {
      // Default to 'scan' if no tab in URL
      setActiveTab('scan');
    }
  }, [searchParams]);

  const handleMenuClick = () => {
    // TODO: Implement menu functionality
    console.log('Menu clicked');
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
    console.log('Notification clicked');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Cập nhật URL khi chuyển tab
    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === 'scan') {
      newSearchParams.set('tab', 'scan');
    } else {
      newSearchParams.set('tab', tab);
    }
    navigate(`/ar?${newSearchParams.toString()}`, { replace: true });
  };

  const content = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
            <OverviewSection />
            </div>
          </>
        );
      case 'history':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
            <HistorySection />
            </div>
          </>
        );
      case 'library':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
            <LibrarySection />
            </div>
          </>
        );
      case 'profile':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
              <ProfileSection />
            </div>
          </>
        );
      case 'scan':
      default:
        return (
          <div className="w-full h-full absolute inset-0" style={{ paddingBottom: '64px' }}>
            {activeTab === 'scan' && <ARViewer key="ar-viewer" />}
            </div>
        );
    }
  }, [activeTab]);

  return (
    <>
      <main className={`${activeTab === 'scan' ? 'w-full h-screen p-0 relative overflow-hidden' : 'flex min-h-screen flex-col bg-white pb-24 sm:pb-32'} bg-white`}>
        {content}
      </main>
      <BottomNav activeKey={activeTab} onChange={handleTabChange} />
    </>
  );
}

export default ARPage;

