import axios from 'axios';
import { getApiBaseUrl } from '@/utils/config';

const baseURL = getApiBaseUrl();

// Create a separate axios instance for admin requests
const adminApi = axios.create({
  baseURL,
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

const basePath = '/api/admin/articles';

export const getAllArticles = async () => {
  const response = await adminApi.get(basePath);
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await adminApi.get(`${basePath}/${id}`);
  return response.data;
};

export const createArticle = async (data) => {
  const response = await adminApi.post(basePath, data);
  return response.data;
};

export const updateArticle = async (id, data) => {
  const response = await adminApi.put(`${basePath}/${id}`, data);
  return response.data;
};

export const deleteArticle = async (id) => {
  await adminApi.delete(`${basePath}/${id}`);
};

export const toggleArticleStatus = async (id) => {
  const response = await adminApi.put(`${basePath}/${id}/toggle-status`);
  return response.data;
};

