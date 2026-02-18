import express from "express";
const router = express.Router();

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
} from '../controllers/userController.js'

// Create a new user
router.post('/', createUser);
router.post('/bulk',  bulkCreateUsers);

// Get all users
router.get('/', getAllUsers);
router.get('/export',    exportUsers);
// Get user by email
router.get('/email/:email', getUserByEmail);

// Get user by ID
router.get('/:id', getUserById);


// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Delete all users (be careful with this in production!)
router.delete('/', deleteAllUsers);

export default router;