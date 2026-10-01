const express = require('express');
const User = require('../models/User');
const Build = require('../models/Build');
const Generation = require('../models/Generation');
const { catalogue } = require('../generator/catalogue');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Require JWT auth + ADMIN role for all admin routes
router.use(protect, adminOnly);

// =======================================================
// SYSTEM STATS & METRICS
// GET /api/v1/admin/stats
// =======================================================
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'ADMIN' });
    const totalBuilds = await Build.countDocuments();
    const totalGenerations = await Generation.countDocuments();

    const recentBuilds = await Build.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentGenerations = await Generation.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalAdmins,
          totalBuilds,
          totalGenerations,
          totalCatalogueModules: Object.keys(catalogue).length,
        },
        recentBuilds,
        recentGenerations,
      },
    });
  } catch (error) {
    console.error('ADMIN STATS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve admin stats' },
    });
  }
});

// =======================================================
// MODULE CATALOGUE (ADMIN VIEW)
// GET /api/v1/admin/modules
// =======================================================
router.get('/modules', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      modules: Object.values(catalogue),
    },
  });
});

// =======================================================
// USERS LIST (ADMIN)
// GET /api/v1/admin/users
// =======================================================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: {
        items: users,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('ADMIN USERS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch users' },
    });
  }
});

// =======================================================
// BUILDS LIST (ADMIN)
// GET /api/v1/admin/builds
// =======================================================
router.get('/builds', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Build.countDocuments();
    const builds = await Build.find()
      .populate('ownerId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: {
        items: builds,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('ADMIN BUILDS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch builds' },
    });
  }
});

module.exports = router;
