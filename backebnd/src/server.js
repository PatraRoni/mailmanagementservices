// src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB, disconnectDB } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mail Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await disconnectDB();
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  server.close(() => process.exit(0));
});