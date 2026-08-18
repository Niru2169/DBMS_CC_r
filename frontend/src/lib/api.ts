import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('music_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('music_token');
      localStorage.removeItem('music_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
