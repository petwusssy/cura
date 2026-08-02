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
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// We can also add an interceptor for handling 401s to refresh token here later if needed

export default api;
