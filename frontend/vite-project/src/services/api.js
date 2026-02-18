import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Axios Instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────────────────────────
// Unwraps axios layer so response.data, response.pagination etc. work directly
api.interceptors.response.use(
  (response) => response.data,
  (error)    => Promise.reject(error)
);

// ── User API ────────────────────────────────────────────────────────────────
export const userAPI = {

  // GET /api/users?page=1&limit=5&search=&startDate=&endDate=&sortOrder=desc
  getAllUsers: ({ page = 1, limit = 5, search = '', startDate = '', endDate = '', sortOrder = 'desc' } = {}) =>
    api.get('/users', {
      params: {
        page,
        limit,
        sortOrder,
        ...(search    && { search }),
        ...(startDate && { startDate }),
        ...(endDate   && { endDate }),
      },
    }),

  // GET /api/users/export?search=&startDate=&endDate=&sortOrder=desc
  exportUsers: ({ search = '', startDate = '', endDate = '', sortOrder = 'desc' } = {}) =>
    api.get('/users/export', {
      params: {
        sortOrder,
        ...(search    && { search }),
        ...(startDate && { startDate }),
        ...(endDate   && { endDate }),
      },
    }),

  // GET /api/users/:id
  getUserById: (id) =>
    api.get(`/users/${id}`),

  // GET /api/users/email/:email
  getUserByEmail: (email) =>
    api.get(`/users/email/${encodeURIComponent(email)}`),

  // POST /api/users
  createUser: (userData) =>
    api.post('/users', userData),

  // POST /api/users/bulk
  bulkCreateUsers: (users) =>
    api.post('/users/bulk', { users }),

  // PUT /api/users/:id
  updateUser: (id, userData) =>
    api.put(`/users/${id}`, userData),

  // DELETE /api/users/:id
  deleteUser: (id) =>
    api.delete(`/users/${id}`),

  // DELETE /api/users
  deleteAllUsers: () =>
    api.delete('/users'),

}; // ← closing the userAPI object