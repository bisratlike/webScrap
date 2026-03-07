'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify the Bearer JWT and attach req.user (fresh from DB).
 * Returns 401 if no token; 403 if invalid/expired.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) throw ApiError.unauthorized('Access token required');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.forbidden('Invalid or expired token');
  }

  const user = await User.findById(payload.userId).select('-passwordHash');
  if (!user) throw ApiError.unauthorized('User not found');

  req.user = user;
  next();
});

/**
 * RBAC guard – only 'admin' role may proceed.
 * Must be used AFTER authenticate().
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
};

/**
 * RBAC guard – ensure at least one of the given roles.
 * Usage: requireRole('admin', 'user')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Required role: ${roles.join(' or ')}`));
  }
  next();
};

/**
 * Optional auth: attaches req.user if a valid token is present,
 * but does NOT block the request if the token is absent/invalid.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (user) req.user = user;
  } catch {
    // ignore invalid token for optional auth
  }

  next();
});

module.exports = { authenticate, requireAdmin, requireRole, optionalAuth };
