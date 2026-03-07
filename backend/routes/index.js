'use strict';

/**
 * Central route aggregator.
 * Mount this on the Express app with:  app.use('/api', require('./routes'));
 */

const { Router } = require('express');

const authRoutes     = require('./auth.routes');
const adminRoutes    = require('./admin.routes');
const aiRoutes       = require('./ai.routes');
const stripeRoutes   = require('./stripe.routes');
const installsRoutes = require('./installs.routes');

const router = Router();

router.use('/auth',     authRoutes);
router.use('/admin',    adminRoutes);
router.use('/ai',       aiRoutes);
router.use('/stripe',   stripeRoutes);
router.use('/installs', installsRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

module.exports = router;
