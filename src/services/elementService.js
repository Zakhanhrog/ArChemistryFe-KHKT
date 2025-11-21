import api from './api.js';

const basePath = '/api/elements';

export const getElements = async () => {
  const { data } = await api.get(basePath);
  return data;
};

export const getElementById = async (id) => {
  const { data } = await api.get(`${basePath}/${id}`);
  return data;
};

export const getElementByMarkerIndex = async (markerIndex) => {
  const { data } = await api.get(`${basePath}/marker/${markerIndex}`);
  return data;
};

