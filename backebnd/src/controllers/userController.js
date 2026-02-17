const { prisma } = require('../config/database');

// Validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both name and email'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim()
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by email
// @route   GET /api/users/email/:email
// @access  Public
const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase()
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Build update data object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one field to update'
      });
    }

    const user = await prisma.user.update({
      where: {
        id: parseInt(id)
      },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    await prisma.user.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all users
// @route   DELETE /api/users
// @access  Public
const deleteAllUsers = async (req, res, next) => {
  try {
    const result = await prisma.user.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'All users deleted successfully',
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  deleteAllUsers
};