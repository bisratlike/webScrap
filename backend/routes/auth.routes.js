'use strict';

const { Router } = require('express');
const { signup, login, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, me);

module.exports = router;
