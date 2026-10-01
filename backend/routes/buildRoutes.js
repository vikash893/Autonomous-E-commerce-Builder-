const express = require('express');
const mongoose = require('mongoose');
const Build = require('../models/Build');
const { protect } = require('../middleware/authMiddleware');
const {
  resolve,
  collectEnvKeys,
  buildEstimatedFileTree,
  normalizeOptions,
  BlueprintError,
} = require('../generator/resolve');

const router = express.Router();

// =======================================================
// RESOLVE MODULES (Preview filetree, dependencies, envKeys)
// POST /api/v1/builds/resolve
// =======================================================
router.post('/resolve', (req, res) => {
  try {
    const { modules = ['products'], options = {} } = req.body;

    const { resolved, autoAdded } = resolve(modules);
    const normalizedOptions = normalizeOptions(resolved, options);
    const envKeys = collectEnvKeys(resolved);
    const fileTree = buildEstimatedFileTree(resolved);

    return res.status(200).json({
      success: true,
      data: {
        resolved,
        autoAdded,
        options: normalizedOptions,
        envKeys: envKeys.map((e) => e.key),
        envKeyDetails: envKeys,
        fileTree,
      },
    });
  } catch (err) {
    if (err instanceof BlueprintError) {
      return res.status(400).json({
        success: false,
        error: { code: err.code || 'VALIDATION_ERROR', message: err.message },
      });
    }
    console.error('RESOLVE ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error resolving blueprint' },
    });
  }
});

// All subsequent routes require authentication
router.use(protect);

// =======================================================
// CREATE BUILD (Save build config)
// POST /api/v1/builds
// =======================================================
router.post('/', async (req, res) => {
  try {
    const { name, store, modules, options } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Build name is required' },
      });
    }

    const selectedModules = Array.isArray(modules) && modules.length ? modules : ['products'];
    const { resolved } = resolve(selectedModules);

    const build = await Build.create({
      ownerId: req.user.userId,
      name: name.trim(),
      store: {
        currency: store?.currency || '₹',
        theme: {
          primary: store?.theme?.primary || '#6366F1',
        },
        logoUrl: store?.logoUrl || '',
      },
      modules: resolved,
      options: options || {},
    });

    return res.status(201).json({
      success: true,
      message: 'Build configuration saved successfully',
      data: build,
    });
  } catch (err) {
    if (err instanceof BlueprintError) {
      return res.status(400).json({
        success: false,
        error: { code: err.code || 'VALIDATION_ERROR', message: err.message },
      });
    }
    console.error('CREATE BUILD ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to save build' },
    });
  }
});

// =======================================================
// LIST USER'S BUILDS
// GET /api/v1/builds/mine
// =======================================================
router.get('/mine', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { ownerId: req.user.userId };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Build.countDocuments(query);
    const builds = await Build.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
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
  } catch (err) {
    console.error('LIST BUILDS ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve builds' },
    });
  }
});

// =======================================================
// GET SPECIFIC BUILD BY ID
// GET /api/v1/builds/:id
// =======================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid build ID format' },
      });
    }

    const build = await Build.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!build) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Build not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: build,
    });
  } catch (err) {
    console.error('GET BUILD ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load build' },
    });
  }
});

// =======================================================
// UPDATE BUILD CONFIG
// PATCH /api/v1/builds/:id
// =======================================================
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, store, modules, options } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid build ID format' },
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (store) updateFields.store = store;
    if (modules) {
      const { resolved } = resolve(modules);
      updateFields.modules = resolved;
    }
    if (options) updateFields.options = options;

    const updated = await Build.findOneAndUpdate(
      { _id: id, ownerId: req.user.userId },
      updateFields,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Build not found' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Build updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('UPDATE BUILD ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update build' },
    });
  }
});

// =======================================================
// DELETE BUILD
// DELETE /api/v1/builds/:id
// =======================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid build ID format' },
      });
    }

    const deleted = await Build.findOneAndDelete({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Build not found' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Build deleted successfully',
      data: deleted,
    });
  } catch (err) {
    console.error('DELETE BUILD ERROR:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete build' },
    });
  }
});

module.exports = router;