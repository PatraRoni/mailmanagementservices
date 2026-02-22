// src/routes/userRoutes.js

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  deleteAllUsers,
  bulkCreateUsers,
  exportUsers,
} from '../controllers/userController.js';

const router = express.Router();

// All user-management routes require authentication
router.use(protect);

router.post('/', createUser);
router.post('/bulk', bulkCreateUsers);

router.get('/', getAllUsers);
router.get('/export', exportUsers);
router.get('/email/:email', getUserByEmail);
router.get('/:id', getUserById);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);
router.delete('/', deleteAllUsers);

export default router;