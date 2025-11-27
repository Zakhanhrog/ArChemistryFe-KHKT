import axios from 'axios';
import { getApiBaseUrl } from '@/utils/config';

const basePath = '/api/admin';

// Create a separate axios instance for admin requests
export const adminApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for admin API
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track redirect state to prevent multiple redirects
let isAdminRedirecting = false;
let adminRedirectTimeout = null;

// Response interceptor
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;
    const errorType = error.response?.data?.errorType;
    
    // Only handle 401 if it's actually a token expiration issue
    if (status === 401) {
      const isTokenExpired = message?.toLowerCase().includes('token') || 
                            message?.toLowerCase().includes('expired') ||
                            message?.toLowerCase().includes('unauthorized');
      
      if (isTokenExpired && !isAdminRedirecting) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
        
        if (adminRedirectTimeout) {
          clearTimeout(adminRedirectTimeout);
        }
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/admin/login')) {
          isAdminRedirecting = true;
          adminRedirectTimeout = setTimeout(() => {
        window.location.href = '/admin/login';
            setTimeout(() => {
              isAdminRedirecting = false;
            }, 1000);
          }, 100);
        }
      }
    }
    
    // For database connection errors (503), don't redirect
    if (status === 503 || errorType === 'DATABASE_CONNECTION_ERROR') {
      console.warn('Database connection error:', message);
    }
    
    return Promise.reject({ ...error, message });
  }
);

export const getAllUsers = async () => {
  const response = await adminApi.get(`${basePath}/users`);
  return response.data;
};

export const getUserById = async (id) => {
  const response = await adminApi.get(`${basePath}/users/${id}`);
  return response.data;
};

export const updateUserStatus = async (id, isActive) => {
  const response = await adminApi.put(`${basePath}/users/${id}/status`, null, {
    params: { isActive }
  });
  return response.data;
};

export const updateUserRole = async (id, role) => {
  const response = await adminApi.put(`${basePath}/users/${id}/role`, null, {
    params: { role }
  });
  return response.data;
};


