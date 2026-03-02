// src/routes/authRoutes.js

import express from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  checkRegistrationStatus,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/registration-status', checkRegistrationStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Forgot password flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

export default router;