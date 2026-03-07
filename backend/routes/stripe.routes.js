'use strict';

const { Router } = require('express');
const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createCheckoutSession,
  createPaymentIntent,
  subscriptionStatus,
  webhook,
} = require('../controllers/stripeController');

const router = Router();

// POST /api/stripe/webhook  – raw body (middleware applied per-route)
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// All remaining Stripe routes require authentication
router.post('/create-checkout-session', authenticate, createCheckoutSession);
router.post('/create-payment-intent',   authenticate, createPaymentIntent);
router.get('/subscription-status',      authenticate, subscriptionStatus);

module.exports = router;
