import { adminApi } from './adminApi.js';

const basePath = '/api/admin/system-configs';

export const getAiArticleInterval = async () => {
  const response = await adminApi.get(`${basePath}/ai-article-interval`);
  return response.data;
};

export const updateAiArticleInterval = async (intervalMs, description) => {
  const response = await adminApi.put(`${basePath}/ai-article-interval`, {
    configValue: intervalMs.toString(),
    description: description || 'Thời gian giữa các lần tạo bài viết AI mới (milliseconds)'
  });
  return response.data;
};

