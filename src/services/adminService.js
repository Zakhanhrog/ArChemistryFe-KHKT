import axios from 'axios';

const basePath = '/api/admin';

// Create a separate axios instance for admin requests
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
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

// Response interceptor
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message;
    
    // Handle 401 Unauthorized - clear token and redirect to admin login
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (!window.location.pathname.includes('/admin/login')) {
        window.location.href = '/admin/login';
      }
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


