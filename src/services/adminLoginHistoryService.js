import { adminApi } from './adminService.js';

const basePath = '/api/admin';

export const getLoginHistory = async (page = 0, size = 20) => {
  const response = await adminApi.get(`${basePath}/login-history`, {
    params: { page, size }
  });
  return response.data;
};

export const getLoginHistoryByUserId = async (userId, page = 0, size = 20) => {
  const response = await adminApi.get(`${basePath}/login-history/user/${userId}`, {
    params: { page, size }
  });
  return response.data;
};

