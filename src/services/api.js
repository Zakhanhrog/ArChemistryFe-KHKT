import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track redirect state to prevent multiple redirects
let isRedirecting = false;
let redirectTimeout = null;

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;
    const errorType = error.response?.data?.errorType;
    
    // Only handle 401 if it's actually a token expiration issue
    // Don't redirect for database connection errors (503) or server errors (500)
    if (status === 401) {
      // Check if it's a token expiration (not a database error)
      const isTokenExpired = message?.toLowerCase().includes('token') || 
                            message?.toLowerCase().includes('expired') ||
                            message?.toLowerCase().includes('unauthorized');
      
      if (isTokenExpired && !isRedirecting) {
        // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
        
        // Debounce redirect to prevent multiple redirects
        if (redirectTimeout) {
          clearTimeout(redirectTimeout);
        }
        
        // Don't redirect if already on login page or admin page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/admin')) {
          isRedirecting = true;
          redirectTimeout = setTimeout(() => {
        window.location.href = '/login';
            // Reset redirect flag after a delay
            setTimeout(() => {
              isRedirecting = false;
            }, 1000);
          }, 100);
        }
      }
    }
    
    // For database connection errors (503), don't redirect - just log and let components handle it
    if (status === 503 || errorType === 'DATABASE_CONNECTION_ERROR') {
      console.warn('Database connection error:', message);
      // Don't redirect, let the UI handle the error gracefully
    }
    
    return Promise.reject({ ...error, message });
  },
);

export default api;

