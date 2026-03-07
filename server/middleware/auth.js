'use strict';

const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is not set');
  return secret;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, getSecret());
    // Refresh user from DB to get latest role/status
    const user = getDb()
      .prepare('SELECT id, email, name, role, stripe_customer_id, created_at FROM users WHERE id = ?')
      .get(payload.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, getSecret());
    const user = getDb()
      .prepare('SELECT id, email, name, role, stripe_customer_id, created_at FROM users WHERE id = ?')
      .get(payload.userId);
    if (user) req.user = user;
  } catch (_) {
    // ignore invalid token for optional auth
  }

  next();
}

module.exports = { authenticateToken, requireAdmin, optionalAuth };
