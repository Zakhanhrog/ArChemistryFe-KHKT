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

const basePath = '/api/admin/ar';

// Marker File APIs
export const getActiveMarkerFile = async () => {
  const response = await adminApi.get(`${basePath}/marker`);
  return response.data;
};

export const uploadMarkerFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await adminApi.post(`${basePath}/marker`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMarkerFile = async (id, data) => {
  const response = await adminApi.put(`${basePath}/marker/${id}`, data);
  return response.data;
};

// Model Files APIs
export const getAllModelFiles = async () => {
  const response = await adminApi.get(`${basePath}/models`);
  return response.data;
};

export const getAllModelFilesIncludingInactive = async () => {
  const response = await adminApi.get(`${basePath}/models/all`);
  return response.data;
};

export const uploadModelFile = async (file, description = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }
  const response = await adminApi.post(`${basePath}/models`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateModelFile = async (id, data) => {
  const response = await adminApi.put(`${basePath}/models/${id}`, data);
  return response.data;
};

export const toggleModelFileStatus = async (id) => {
  const response = await adminApi.put(`${basePath}/models/${id}/toggle-status`);
  return response.data;
};

// Targets APIs
export const getAllTargets = async () => {
  const response = await adminApi.get(`${basePath}/targets`);
  return response.data;
};

export const getAllTargetsIncludingInactive = async () => {
  const response = await adminApi.get(`${basePath}/targets/all`);
  return response.data;
};

export const getTargetById = async (id) => {
  const response = await adminApi.get(`${basePath}/targets/${id}`);
  return response.data;
};

export const createTarget = async (data) => {
  const response = await adminApi.post(`${basePath}/targets`, data);
  return response.data;
};

export const updateTarget = async (id, data) => {
  const response = await adminApi.put(`${basePath}/targets/${id}`, data);
  return response.data;
};

export const toggleTargetStatus = async (id) => {
  const response = await adminApi.put(`${basePath}/targets/${id}/toggle-status`);
  return response.data;
};

