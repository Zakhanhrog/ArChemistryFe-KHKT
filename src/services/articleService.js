import api from './api.js';

const basePath = '/api/articles';

export const getActiveArticles = async () => {
  const response = await api.get(basePath);
  return response.data;
};

export const getActiveArticlesPaginated = async (page = 0, size = 10) => {
  const response = await api.get(basePath, {
    params: { page, size }
  });
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data;
};

export const markArticleAsRead = async (id) => {
  const response = await api.post(`${basePath}/${id}/mark-read`);
  return response.data;
};

