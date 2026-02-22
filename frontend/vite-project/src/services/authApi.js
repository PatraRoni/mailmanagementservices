// src/services/authApi.js

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const registerUser = (userData) =>
  authApi.post('/register', userData);

export const loginUser = (credentials) =>
  authApi.post('/login', credentials);

export const logoutUser = () =>
  authApi.post('/logout');

export const refreshToken = () =>
  authApi.post('/refresh-token');

export const getCurrentUser = () =>
  authApi.get('/me');

export const checkRegistrationStatus = () =>
  authApi.get('/registration-status');

// Forgot password
export const forgotPassword = (email) =>
  authApi.post('/forgot-password', { email });

export const verifyOTP = (email, otp) =>
  authApi.post('/verify-otp', { email, otp });

export const resetPassword = (resetToken, password, confirmPassword) =>
  authApi.post('/reset-password', { resetToken, password, confirmPassword });

export default authApi;