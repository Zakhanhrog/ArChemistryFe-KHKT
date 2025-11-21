import { getModelFromDB, saveModelToDB } from './indexedDB.js';

export const fetchAndCacheModel = async (url) => {
  if (!url) {
    throw new Error('Thiếu modelUrl trong metadata');
  }

  const cached = await getModelFromDB(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải mô hình từ ${url}`);
  }

  const buffer = await response.arrayBuffer();
  await saveModelToDB(url, buffer);
  return buffer;
};

