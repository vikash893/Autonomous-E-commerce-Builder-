const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const { generate } = require('../generator/generate');
const { streamZip } = require('../generator/zip');
const { BlueprintError } = require('../generator/resolve');
const Build = require('../models/Build');
const Generation = require('../models/Generation');

const router = express.Router();

// Optional JWT auth helper
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'default_jwt_secret');
      req.user = decoded;
    } catch {
      // ignore invalid optional token
    }
  }
  next();
};

// =======================================================
// GENERATE CODEBASE AND STREAM ZIP
// POST /api/v1/generate
// =======================================================
router.post('/', optionalAuth, async (req, res) => {
  let tempDir = null;
  try {
    const blueprint = req.body || {};

    if (!blueprint.storeName || !blueprint.storeName.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Store name is required' },
      });
    }

    // Run generation engine
    const genResult = await generate(blueprint);
    tempDir = genResult.tempDir;

    // Track analytics in database asynchronously ONLY if database is connected
    if (mongoose.connection.readyState === 1) {
      try {
        const ownerId = req.user?.userId;
        const buildId = blueprint.buildId;

        const validOwnerId = ownerId && mongoose.Types.ObjectId.isValid(ownerId) ? ownerId : undefined;
        const validBuildId = buildId && mongoose.Types.ObjectId.isValid(buildId) ? buildId : undefined;

        Generation.create({
          buildId: validBuildId,
          ownerId: validOwnerId,
          storeName: blueprint.storeName,
          resolvedModules: genResult.resolved,
          fileCount: genResult.files.length,
          status: 'SUCCESS',
        }).catch((err) => console.warn('Analytics Generation.create:', err.message));

        if (validBuildId) {
          Build.findByIdAndUpdate(validBuildId, { lastGeneratedAt: new Date() }).catch(() => {});
        }
      } catch (dbErr) {
        console.warn('Analytics logging warning:', dbErr.message);
      }
    }

    // Stream the zip file to the client immediately
    return streamZip(genResult.outDir, genResult.name, res, tempDir);
  } catch (err) {
    if (tempDir) {
      await fs.remove(tempDir).catch(() => {});
    }

    console.error('GENERATION ERROR:', err);

    if (err instanceof BlueprintError) {
      return res.status(400).json({
        success: false,
        error: { code: err.code || 'VALIDATION_ERROR', message: err.message },
      });
    }

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message || 'Generation failed' },
      });
    }
  }
});

module.exports = router;