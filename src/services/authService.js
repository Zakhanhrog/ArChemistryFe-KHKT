import api from './api.js';

const basePath = '/api/auth';
const adminBasePath = '/api/admin';

export const register = async (data) => {
  const response = await api.post(`${basePath}/register`, data);
  // Store token and user info
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify({
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      avatarUrl: response.data.avatarUrl
    }));
  }
  return response.data;
};

export const login = async (data) => {
  const response = await api.post(`${basePath}/login`, data);
  // Store token and user info
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    // Note: avatarUrl will be updated after fetching from /me endpoint
    localStorage.setItem('user', JSON.stringify({
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      avatarUrl: response.data.avatarUrl || null
    }));
  }
  return response.data;
};

export const adminLogin = async (data) => {
  const response = await api.post(`${adminBasePath}/login`, data);
  // Store token and user info
  if (response.data.token) {
    localStorage.setItem('adminToken', response.data.token);
    localStorage.setItem('adminUser', JSON.stringify({
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role
    }));
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get(`${basePath}/me`);
  // Update localStorage with latest user info including avatarUrl
  if (response.data) {
    const existingUserStr = localStorage.getItem('user');
    if (existingUserStr) {
      try {
        const existingUser = JSON.parse(existingUserStr);
        const updatedUser = {
          ...existingUser,
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          avatarUrl: response.data.avatarUrl || existingUser.avatarUrl || null
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Error updating user in localStorage:', e);
      }
    }
  }
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put(`${basePath}/profile`, data);
  // Update stored user info
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify({
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      avatarUrl: response.data.avatarUrl
    }));
  }
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put(`${basePath}/change-password`, data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export const googleLogin = async (idToken) => {
  const response = await api.post(`${basePath}/google`, { idToken });
  // Store token and user info
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    // Note: avatarUrl will be updated after fetching from /me endpoint
    localStorage.setItem('user', JSON.stringify({
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      avatarUrl: response.data.avatarUrl || null
    }));
  }
  return response.data;
};
