'use strict';

const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  dashboard,
  listUsers,
  listSubscriptions,
  usageStats,
  installStats,
  changeRole,
} = require('../controllers/adminController');

const router = Router();

// All admin routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// GET  /api/admin/dashboard
router.get('/dashboard', dashboard);

// GET  /api/admin/users
router.get('/users', listUsers);

// GET  /api/admin/subscriptions
router.get('/subscriptions', listSubscriptions);

// GET  /api/admin/usage
router.get('/usage', usageStats);

// GET  /api/admin/installs
router.get('/installs', installStats);

// POST /api/admin/users/:id/role
router.post('/users/:id/role', changeRole);

module.exports = router;
