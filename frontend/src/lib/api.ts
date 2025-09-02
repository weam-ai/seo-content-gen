import axios, { AxiosInstance, AxiosResponse, AxiosRequestHeaders } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// API base configuration
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:9001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const state = useAuthStore.getState();
    let jwt = state.getJwtToken();

    // No fallback to access_token; only JWT is used

    if (jwt) {
      const hdrs = config.headers as any;
      if (hdrs && typeof hdrs.set === 'function') hdrs.set('Authorization', `Bearer ${jwt}`);
      else {
        config.headers = { ...(config.headers as any), Authorization: `Bearer ${jwt}` } as AxiosRequestHeaders;
      }
      console.debug('Auth header set (JWT).');
    } else {
      console.debug('Auth header NOT set (no token available).');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (simplified for single-user mode)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // In single-user mode, just return the error without token refresh logic
    return Promise.reject(error);
  }
);

export default api;
