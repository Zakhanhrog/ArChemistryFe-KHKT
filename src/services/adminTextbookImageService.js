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

const BASE_PATH = '/api/admin/textbook-images';

export const getTextbookImages = async (textbookId) => {
  const response = await adminApi.get(`${BASE_PATH}/textbook/${textbookId}`);
  return response.data;
};

export const createTextbookImage = async (data, imageFile, model3dFile = null) => {
  const formData = new FormData();
  // Append JSON as string, not Blob
  formData.append('data', JSON.stringify(data));
  formData.append('imageFile', imageFile);
  if (model3dFile) {
    formData.append('model3dFile', model3dFile);
  }
  
  const response = await adminApi.post(BASE_PATH, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 600000, // 10 minutes timeout for large file uploads (200MB)
  });
  return response.data;
};

export const updateTextbookImage = async (id, data, imageFile = null, model3dFile = null) => {
  const formData = new FormData();
  // Append JSON as string, not Blob
  formData.append('data', JSON.stringify(data));
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }
  if (model3dFile) {
    formData.append('model3dFile', model3dFile);
  }
  
  const response = await adminApi.put(`${BASE_PATH}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 600000, // 10 minutes timeout for large file uploads (200MB)
  });
  return response.data;
};

export const deleteTextbookImage = async (id) => {
  await adminApi.delete(`${BASE_PATH}/${id}`);
};

