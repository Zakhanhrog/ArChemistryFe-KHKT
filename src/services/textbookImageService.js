import api from './api';

const BASE_PATH = '/api/textbooks';

export const getTextbookImages = async (textbookId) => {
  const response = await api.get(`${BASE_PATH}/${textbookId}/images`);
  return response.data;
};

export const getTextbookImageById = async (textbookId, imageId) => {
  const response = await api.get(`${BASE_PATH}/${textbookId}/images/${imageId}`);
  return response.data;
};

