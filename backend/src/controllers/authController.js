// src/controllers/authController.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOTPEmail } from '../utils/email.js';

const prisma = new PrismaClient();

// ── Token helpers ───────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ── Generate 6-digit OTP ────────────────────────────────────
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ── CHECK REGISTRATION STATUS ───────────────────────────────
export const checkRegistrationStatus = async (req, res, next) => {
  try {
    const userCount = await prisma.user.count({
      where: { password: { not: null } },
    });

    res.status(200).json({
      success: true,
      data: { registrationOpen: userCount === 0 },
    });
  } catch (error) {
    next(error);
  }
};

// ── REGISTER ────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const existingAccountCount = await prisma.user.count({
      where: { password: { not: null } },
    });

    if (existingAccountCount > 0) {
      return res.status(403).json({
        success: false,
        error: 'Registration is closed. An account already exists.',
      });
    }

    const { name, email, password, confirmPassword } = req.body;

    const errors = [];
    if (!name || name.trim().length < 2)
      errors.push('Name must be at least 2 characters.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push('Please provide a valid email.');
    if (!password || password.length < 8)
      errors.push('Password must be at least 8 characters.');
    if (password !== confirmPassword)
      errors.push('Passwords do not match.');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(' ') });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'admin',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. You are the admin.',
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ───────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── FORGOT PASSWORD — Send OTP ──────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide your email.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.password) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    // Invalidate any previous unused OTPs for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate and save OTP
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send email
    await sendOTPEmail(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// ── VERIFY OTP ──────────────────────────────────────────────
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and OTP.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP or email.',
      });
    }

    // Get the latest unused, non-expired OTP
    const resetRecords = await prisma.passwordReset.findMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (resetRecords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired or is invalid. Please request a new one.',
      });
    }

    const resetRecord = resetRecords[0];
    const isValidOTP = await bcrypt.compare(otp, resetRecord.otp);

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.',
      });
    }

    // Generate a short-lived reset token
    const resetToken = jwt.sign(
      { userId: user.id, resetId: resetRecord.id },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

// ── RESET PASSWORD ──────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reset token, password, and confirm password.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match.',
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Reset link has expired. Please request a new OTP.',
      });
    }

    // Check the reset record is still valid
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { id: decoded.resetId },
    });

    if (!resetRecord || resetRecord.used) {
      return res.status(400).json({
        success: false,
        error: 'This reset link has already been used.',
      });
    }

    // Hash new password & update
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: decoded.resetId },
        data: { used: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

// ── REFRESH TOKEN ───────────────────────────────────────────
export const refreshAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, error: 'No refresh token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found.' });
    }

    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: { user, accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token.',
    });
  }
};

// ── LOGOUT ──────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ── GET ME ──────────────────────────────────────────────────
export const getMe = (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
};