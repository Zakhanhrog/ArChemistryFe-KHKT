import api from './api.js';

const basePath = '/api/articles';

export const getActiveArticles = async () => {
  const response = await api.get(basePath);
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data;
};

