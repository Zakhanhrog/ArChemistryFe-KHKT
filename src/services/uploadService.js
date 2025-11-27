import axios from 'axios';

const baseURL = 'http://localhost:8080';

export const uploadFile = async (file, folder = 'avatars') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  // Check for admin token first, then regular token
  const adminToken = localStorage.getItem('adminToken');
  const token = localStorage.getItem('token');
  const authToken = adminToken || token;
  
  const response = await axios.post(`${baseURL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });
  
  return response.data.url;
};

