import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ARViewer from '@/components/ARViewer.jsx';
import PageHeader from '@/components/layout/PageHeader.jsx';
import BottomNav from '@/components/layout/BottomNav.jsx';
import useAuthStore from '@/hooks/useAuth';
import { getCurrentUser } from '@/services/authService';

// Lazy load các sections để giảm initial bundle size
const ExploreSection = lazy(() => import('@/components/dashboard/ExploreSection.jsx'));
const MaterialsSection = lazy(() => import('@/components/dashboard/MaterialsSection.jsx'));
const AIAssistantSection = lazy(() => import('@/components/dashboard/AIAssistantSection.jsx'));
const ProfileSection = lazy(() => import('@/components/dashboard/ProfileSection.jsx'));

function ARPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('scan');
  const [arViewerKey, setArViewerKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Refresh user info from server to ensure avatarUrl is up to date
    const refreshUserInfo = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const token = localStorage.getItem('token');
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role,
            token: token,
            avatarUrl: currentUser.avatarUrl || null
          });
        }
      } catch (error) {
        // Error refreshing user info
      }
    };
    
    refreshUserInfo();
  }, [isAuthenticated, navigate, setUser]);

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
  };

  const handleNotificationClick = () => {
    // TODO: Implement notification functionality
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Cập nhật URL khi chuyển tab
    const newSearchParams = new URLSearchParams(searchParams);
    if (tab === 'scan') {
      newSearchParams.set('tab', 'scan');
      // Force remount ARViewer khi quay lại tab scan
      setArViewerKey(prev => prev + 1);
    } else {
      newSearchParams.set('tab', tab);
    }
    navigate(`/ar?${newSearchParams.toString()}`, { replace: true });
  };

  const content = useMemo(() => {
    switch (activeTab) {
      case 'explore':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-gray-500">Đang tải...</div></div>}>
              <ExploreSection />
              </Suspense>
            </div>
          </>
        );
      case 'materials':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-6 sm:py-8 pt-20 sm:pt-24">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-gray-500">Đang tải...</div></div>}>
                <MaterialsSection />
              </Suspense>
            </div>
          </>
        );
      case 'ai-assistant':
        return (
          <>
            <PageHeader
              onMenuClick={handleMenuClick}
              onNotificationClick={handleNotificationClick}
            />
            <div className="container px-4 sm:px-6 py-2 pt-20 sm:pt-20 h-full">
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-gray-500">Đang tải...</div></div>}>
              <AIAssistantSection />
              </Suspense>
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
              <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-gray-500">Đang tải...</div></div>}>
              <ProfileSection />
              </Suspense>
            </div>
          </>
        );
      case 'scan':
      default:
        return (
          <div className="w-full h-full absolute inset-0" style={{ paddingBottom: '64px' }}>
            {activeTab === 'scan' && <ARViewer key={`ar-viewer-${arViewerKey}`} />}
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

