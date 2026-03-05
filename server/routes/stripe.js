'use strict';

const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('placeholder') || key === 'sk_test_your_stripe_secret_key') {
    throw Object.assign(new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env'), { status: 503 });
  }
  return require('stripe')(key);
}

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', authenticateToken, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const user = req.user;
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      getDb()
        .prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?')
        .run(customerId, user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 300,
          recurring: { interval: 'month' },
          product_data: { name: 'DataSnap Pro – Monthly' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/success.html',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:3000/register.html',
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/create-payment-intent
router.post('/create-payment-intent', authenticateToken, async (req, res, next) => {
  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: 300,
      currency: 'usd',
      metadata: { userId: String(req.user.id) },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/webhook  (raw body middleware applied in app.js)
router.post('/webhook', async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = getStripe();
    if (webhookSecret && !webhookSecret.includes('placeholder')) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const db = getDb();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const userId = getUserIdByCustomer(db, session.customer);
          if (userId) {
            const existing = db.prepare(
              'SELECT id FROM subscriptions WHERE stripe_subscription_id = ?'
            ).get(sub.id);
            if (!existing) {
              db.prepare(`
                INSERT INTO subscriptions
                  (user_id, stripe_subscription_id, plan, status, amount, current_period_start, current_period_end)
                VALUES (?, ?, 'pro', ?, 300, ?, ?)
              `).run(
                userId,
                sub.id,
                sub.status,
                new Date(sub.current_period_start * 1000).toISOString(),
                new Date(sub.current_period_end * 1000).toISOString()
              );
            } else {
              db.prepare(
                'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
              ).run(sub.status, sub.id);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        db.prepare(`
          UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?
          WHERE stripe_subscription_id = ?
        `).run(
          sub.status,
          new Date(sub.current_period_start * 1000).toISOString(),
          new Date(sub.current_period_end * 1000).toISOString(),
          sub.id
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        db.prepare(
          'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
        ).run('cancelled', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(
            'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?'
          ).run('expired', invoice.subscription);
        }
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

function getUserIdByCustomer(db, customerId) {
  const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
  return user ? user.id : null;
}

// GET /api/stripe/subscription-status
router.get('/subscription-status', authenticateToken, (req, res) => {
  const sub = getDb()
    .prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(req.user.id);

  res.json({ subscription: sub || null });
});

module.exports = router;
