'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard
router.get('/dashboard', (req, res, next) => {
  try {
    const db = getDb();

    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeSubscriptions = db.prepare(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('active', 'trialing')"
    ).get().count;
    const totalRevenue = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status IN ('active', 'trialing')"
    ).get().total;
    const totalInstalls = db.prepare('SELECT COUNT(*) as count FROM installs').get().count;

    const recentSignups = db.prepare(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    ).all();

    const recentActivity = db.prepare(
      'SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 20'
    ).all();

    res.json({
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      totalInstalls,
      recentSignups,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', (req, res, next) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (status) {
      where = 'WHERE s.status = ?';
      params.push(status);
    }

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM subscriptions s ${where}`
    ).get(...params).count;

    const rows = db.prepare(`
      SELECT s.*, u.email, u.name
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ total, page, limit, subscriptions: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', (req, res, next) => {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE email LIKE ? OR name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM users ${where}`
    ).get(...params).count;

    const users = db.prepare(`
      SELECT id, email, name, role, stripe_customer_id, created_at
      FROM users ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({ total, page, limit, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/usage
router.get('/usage', (req, res, next) => {
  try {
    const db = getDb();

    const byAction = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM usage_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY action
    `).all();

    const byDay = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as count
      FROM usage_logs
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    res.json({ byAction, byDay });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/installs
router.get('/installs', (req, res, next) => {
  try {
    const db = getDb();

    const total = db.prepare('SELECT COUNT(*) as count FROM installs').get().count;

    const byDay = db.prepare(`
      SELECT date(installed_at) as day, COUNT(*) as count
      FROM installs
      WHERE installed_at >= datetime('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const recent = db.prepare(
      'SELECT * FROM installs ORDER BY installed_at DESC LIMIT 50'
    ).all();

    res.json({ total, byDay, recent });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/:id/role
router.post('/users/:id/role', (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'role must be "admin" or "user"' });
    }

    const db = getDb();
    const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
