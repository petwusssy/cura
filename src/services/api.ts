import axios from 'axios';

// If deployed on Vercel but VITE_API_URL is missing, we shouldn't use localhost.
// Please set VITE_API_URL in your Vercel project settings to point to your Render backend (e.g. https://cura-backend.onrender.com/api)
// If deployed on Vercel but VITE_API_URL is missing, we shouldn't use localhost.
const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:8000/api');

if (isProd && !import.meta.env.VITE_API_URL) {
  console.error('CRITICAL ERROR: VITE_API_URL is not set in production. Please set it in your hosting provider settings to point to your backend URL.');
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('cura_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for auto token refresh and 401 handling
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Don't retry if the failing request is refresh or login itself
      if (originalRequest.url?.includes('/auth/refresh/') || originalRequest.url?.includes('/auth/login/')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('cura_access_token');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('username');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_URL}/auth/refresh/`, {}, { withCredentials: true });
        const newToken = res.data?.access;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          localStorage.setItem('cura_access_token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('cura_access_token');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('username');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
