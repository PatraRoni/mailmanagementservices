import { prisma } from '../config/database.js';


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


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


const getAllUsers = async (req, res, next) => {
  try {
    const page      = parseInt(req.query.page)  || 1;
    const limit     = parseInt(req.query.limit) || 5;
    const search    = req.query.search?.trim()  || '';
    const startDate = req.query.startDate       || null;
    const endDate   = req.query.endDate         || null;
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    const skip      = (page - 1) * limit;

    // ── Build dynamic where clause ───────────────────────────────────────
    const where = {};

    // Filter by name (case-insensitive)
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate); // from start of day
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);            // to end of day
        where.createdAt.lte = end;
      }
    }

    // Run both queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },         // newest or oldest first
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


const bulkCreateUsers = async (req, res, next) => {
  try {
    const { users } = req.body;

    // Validate request body
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of users',
      });
    }

    if (users.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 500 users can be imported at once',
      });
    }

    // Validate each row
    const validUsers   = [];
    const failedRows   = [];
    const emailsSeen   = new Set(); // catch duplicates within the file itself

    users.forEach((user, index) => {
      const rowErrors = [];
      const name  = String(user.name  || '').trim();
      const email = String(user.email || '').toLowerCase().trim();

      if (!name)                   rowErrors.push('Name is required');
      if (!email)                  rowErrors.push('Email is required');
      else if (!validateEmail(email)) rowErrors.push('Invalid email format');
      else if (emailsSeen.has(email)) rowErrors.push('Duplicate email in file');
      else emailsSeen.add(email);

      if (rowErrors.length > 0) {
        failedRows.push({ row: index + 1, data: user, errors: rowErrors });
      } else {
        validUsers.push({ name, email });
      }
    });

    if (validUsers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid users to import',
        data: { imported: 0, skipped: 0, failed: failedRows.length },
        failedRows,
      });
    }

    // createMany with skipDuplicates skips emails already in DB
    const result = await prisma.user.createMany({
      data: validUsers,
      skipDuplicates: true,
    });

    const skipped = validUsers.length - result.count;

    res.status(201).json({
      success: true,
      message: `Import complete: ${result.count} imported, ${skipped} skipped, ${failedRows.length} failed`,
      data: {
        imported: result.count,
        skipped,
        failed: failedRows.length,
        failedRows: failedRows.length > 0 ? failedRows : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

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

const exportUsers = async (req, res, next) => {
  try {
    const search    = req.query.search?.trim() || '';
    const startDate = req.query.startDate      || null;
    const endDate   = req.query.endDate        || null;
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Reuse same filter logic as getAllUsers — but NO pagination
    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: sortOrder },
    });

    res.status(200).json({
      success: true,
      message: `${users.length} users ready for export`,
      data: users,
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  deleteAllUsers,
  bulkCreateUsers,
  exportUsers,
};
