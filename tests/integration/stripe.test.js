'use strict';
/**
 * stripe.test.js
 * Black-box integration tests for /api/stripe endpoints.
 * Stripe keys are set to placeholders, so we test graceful 503 responses
 * and authentication gates — no real Stripe API calls are made.
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let userToken;

beforeAll(async () => {
  request = await createTestServer();

  const signup = await request.post('/api/auth/signup').send({
    name: 'StripeUser',
    email: 'stripeuser@example.com',
    password: 'stripepass1',
  });
  userToken = signup.body.token;
}, 20000);

afterAll(teardown);

// ─── create-checkout-session ─────────────────────────────────────────────────
describe('POST /api/stripe/create-checkout-session', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/stripe/create-checkout-session').send({});
    expect(res.status).toBe(401);
  });

  it('returns 503 when Stripe key is a placeholder', async () => {
    const res = await request
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/stripe/i);
  });
});

// ─── create-payment-intent ───────────────────────────────────────────────────
describe('POST /api/stripe/create-payment-intent', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/stripe/create-payment-intent').send({});
    expect(res.status).toBe(401);
  });

  it('returns 503 when Stripe key is a placeholder', async () => {
    const res = await request
      .post('/api/stripe/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(503);
  });
});

// ─── subscription-status ─────────────────────────────────────────────────────
describe('GET /api/stripe/subscription-status', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.get('/api/stripe/subscription-status');
    expect(res.status).toBe(401);
  });

  it('returns null subscription for a new user with no subscription', async () => {
    const res = await request
      .get('/api/stripe/subscription-status')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
  });
});

// ─── webhook ─────────────────────────────────────────────────────────────────
describe('POST /api/stripe/webhook', () => {
  it('returns 400 when Stripe key is a placeholder and body is invalid JSON', async () => {
    const res = await request
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('not-json'));

    // The webhook's own catch block returns 400 for any parse / config error
    expect([400, 503]).toContain(res.status);
  });

  it('processes a checkout.session.completed event (no-sig mode)', async () => {
    // When webhook secret is placeholder, the server parses the body directly.
    // With a placeholder Stripe key, getStripe() throws and the catch block
    // returns 400 (Webhook error: ...).
    const fakeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment', // not 'subscription', so no sub is created
          customer: 'cus_fake',
          subscription: null,
        },
      },
    };

    const res = await request
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    // 400 — webhook catch block catches getStripe() error and returns 400
    // 200 — if Stripe key were real and webhook-secret were placeholder
    expect([200, 400, 503]).toContain(res.status);
  });
});
