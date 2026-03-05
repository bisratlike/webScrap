'use strict';

const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// POST /api/installs/register
router.post('/register', (req, res, next) => {
  try {
    const { extensionId, userId } = req.body;

    if (!extensionId) {
      return res.status(400).json({ error: 'extensionId is required' });
    }

    const db = getDb();
    const existing = db.prepare(
      'SELECT id FROM installs WHERE extension_id = ? AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))'
    ).get(extensionId, userId || null, userId || null);

    if (existing) {
      db.prepare(
        'UPDATE installs SET last_seen = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(existing.id);
      return res.json({ registered: false, updated: true });
    }

    db.prepare(
      'INSERT INTO installs (extension_id, user_id) VALUES (?, ?)'
    ).run(extensionId, userId || null);

    res.status(201).json({ registered: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/installs/ping
router.post('/ping', (req, res, next) => {
  try {
    const { extensionId, userId } = req.body;

    if (!extensionId) {
      return res.status(400).json({ error: 'extensionId is required' });
    }

    const db = getDb();
    const result = db.prepare(
      'UPDATE installs SET last_seen = CURRENT_TIMESTAMP WHERE extension_id = ? AND (user_id = ? OR user_id IS NULL)'
    ).run(extensionId, userId || null);

    if (result.changes === 0) {
      // Auto-register on first ping
      db.prepare(
        'INSERT INTO installs (extension_id, user_id) VALUES (?, ?)'
      ).run(extensionId, userId || null);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
