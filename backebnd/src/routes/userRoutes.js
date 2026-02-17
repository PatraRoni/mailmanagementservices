const express = require('express');
const router = express.Router();

const {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  deleteAllUsers
} = require('../controllers/userController');

// Create a new user
router.post('/', createUser);

// Get all users
router.get('/', getAllUsers);

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

module.exports = router;