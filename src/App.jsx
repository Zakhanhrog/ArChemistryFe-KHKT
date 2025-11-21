import { useState, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import ARPage from './pages/ARPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

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
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ar" element={<ARPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
      )}
    </>
  );
}

export default App;
