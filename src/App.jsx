import { useState, useEffect, lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen.jsx';

// Lazy load pages để giảm initial bundle size
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ARPage = lazy(() => import('./pages/ARPage.jsx'));
const ARModelDetailPage = lazy(() => import('./pages/ARModelDetailPage.jsx'));
const WelcomePage = lazy(() => import('./pages/WelcomePage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const LoginLoadingPage = lazy(() => import('./pages/LoginLoadingPage.jsx'));
const HelpPage = lazy(() => import('./pages/HelpPage.jsx'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const ARManagementPage = lazy(() => import('./pages/admin/ARManagementPage.jsx'));
const ArticleManagementPage = lazy(() => import('./pages/admin/ArticleManagementPage.jsx'));
const TextbookManagementPage = lazy(() => import('./pages/admin/TextbookManagementPage.jsx'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage.jsx'));
const LoginHistoryPage = lazy(() => import('./pages/admin/LoginHistoryPage.jsx'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-gray-500">Đang tải...</div>
  </div>
);

function App() {
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Hiển thị loading screen mỗi khi vào trang chủ
    if (location.pathname === '/') {
      setShowLoading(true);
    } else {
      setShowLoading(false);
    }
  }, [location.pathname]);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <>
      {showLoading ? (
        <LoadingScreen onLoadingComplete={handleLoadingComplete} />
      ) : (
        <Suspense fallback={<LoadingFallback />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ar" element={<ARPage />} />
      <Route path="/ar/model-detail" element={<ARModelDetailPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login-loading" element={<LoginLoadingPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="ar" element={<ARManagementPage />} />
        <Route path="articles" element={<ArticleManagementPage />} />
        <Route path="textbooks" element={<TextbookManagementPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="login-history" element={<LoginHistoryPage />} />
      </Route>
    </Routes>
        </Suspense>
      )}
    </>
  );
}

export default App;
