'use strict';

const Install = require('../models/Install');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/installs/register
const register = asyncHandler(async (req, res) => {
  const { extensionId, userId } = req.body;

  if (!extensionId) throw ApiError.badRequest('extensionId is required');

  const filter = userId
    ? { extensionId, userId }
    : { extensionId, userId: null };

  const existing = await Install.findOne(filter);

  if (existing) {
    existing.lastSeen = new Date();
    await existing.save();
    return res.json({ registered: false, updated: true });
  }

  await Install.create({ extensionId, userId: userId || null });
  res.status(201).json({ registered: true });
});

// POST /api/installs/ping
const ping = asyncHandler(async (req, res) => {
  const { extensionId, userId } = req.body;

  if (!extensionId) throw ApiError.badRequest('extensionId is required');

  const filter = userId
    ? { extensionId, userId }
    : { extensionId };

  const updated = await Install.findOneAndUpdate(
    filter,
    { lastSeen: new Date() },
    { new: true }
  );

  if (!updated) {
    // Auto-register on first ping
    await Install.create({ extensionId, userId: userId || null });
  }

  res.json({ ok: true });
});

module.exports = { register, ping };
