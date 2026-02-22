// src/services/api.js

import axios from 'axios';
import { refreshToken } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,                        // ← send cookies
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ─────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor (with auto-refresh) ────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,                  // unwrap as before
  async (error) => {
    const originalRequest = error.config;

    // Auto-refresh on TOKEN_EXPIRED
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await refreshToken();
        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── User API (unchanged) ────────────────────────────────────
export const userAPI = {
  getAllUsers: ({ page = 1, limit = 5, search = '', startDate = '', endDate = '', sortOrder = 'desc' } = {}) =>
    api.get('/users', {
      params: {
        page, limit, sortOrder,
        ...(search    && { search }),
        ...(startDate && { startDate }),
        ...(endDate   && { endDate }),
      },
    }),

  exportUsers: ({ search = '', startDate = '', endDate = '', sortOrder = 'desc' } = {}) =>
    api.get('/users/export', {
      params: {
        sortOrder,
        ...(search    && { search }),
        ...(startDate && { startDate }),
        ...(endDate   && { endDate }),
      },
    }),

  getUserById: (id) => api.get(`/users/${id}`),
  getUserByEmail: (email) => api.get(`/users/email/${encodeURIComponent(email)}`),
  createUser: (userData) => api.post('/users', userData),
  bulkCreateUsers: (users) => api.post('/users/bulk', { users }),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  deleteAllUsers: () => api.delete('/users'),
};

export default api;