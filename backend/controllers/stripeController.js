'use strict';

const Subscription = require('../models/Subscription');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('placeholder') || key === 'sk_test_your_stripe_secret_key') {
    throw ApiError.unavailable('Stripe is not configured. Set STRIPE_SECRET_KEY in .env');
  }
  return require('stripe')(key);
}

// POST /api/stripe/create-checkout-session
const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const user   = req.user;

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
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
    cancel_url:  process.env.CANCEL_URL  || 'http://localhost:3000/register.html',
  });

  res.json({ sessionId: session.id, url: session.url });
});

// POST /api/stripe/create-payment-intent
const createPaymentIntent = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount:   300,
    currency: 'usd',
    metadata: { userId: req.user._id.toString() },
  });
  res.json({ clientSecret: intent.client_secret });
});

// GET /api/stripe/subscription-status
const subscriptionStatus = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ subscription: sub ? sub.toJSON() : null });
});

// POST /api/stripe/webhook  (raw body applied in app.js)
const webhook = asyncHandler(async (req, res) => {
  const sig           = req.headers['stripe-signature'];
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.subscription) {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const user = await User.findOne({ stripeCustomerId: session.customer });
        if (user) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            {
              userId:               user._id,
              stripeSubscriptionId: sub.id,
              plan:                 'pro',
              status:               sub.status,
              amount:               300,
              currentPeriodStart:   new Date(sub.current_period_start * 1000),
              currentPeriodEnd:     new Date(sub.current_period_end   * 1000),
            },
            { upsert: true, new: true }
          );
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          status:             sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd:   new Date(sub.current_period_end   * 1000),
        }
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: 'cancelled' }
      );
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: invoice.subscription },
          { status: 'expired' }
        );
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
});

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  subscriptionStatus,
  webhook,
};
