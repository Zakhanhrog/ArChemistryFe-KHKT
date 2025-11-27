import api from './api.js';

const basePath = '/api/textbooks';

export const getTextbooks = async (bookSet, grade) => {
  const response = await api.get(basePath, {
    params: { bookSet, grade }
  });
  return response.data;
};

export const getTextbookById = async (id) => {
  const response = await api.get(`${basePath}/${id}`);
  return response.data;
};

import { getApiBaseUrl } from '@/utils/config';

export const getTextbookPdfUrl = (id) => {
  const baseURL = api.defaults.baseURL || getApiBaseUrl();
  return `${baseURL}${basePath}/${id}/pdf`;
};

