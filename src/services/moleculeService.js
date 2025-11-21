import api from './api.js';

const basePath = '/api/molecules';

export const getMolecules = async () => {
  const { data } = await api.get(basePath);
  return data;
};

export const getMoleculeById = async (id) => {
  const { data } = await api.get(`${basePath}/${id}`);
  return data;
};

export const getMoleculeByMarkerIndex = async (markerIndex) => {
  const { data } = await api.get(`${basePath}/marker/${markerIndex}`);
  return data;
};

