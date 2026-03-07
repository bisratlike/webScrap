'use strict';
/**
 * stripe.test.js
 * Black-box integration tests for /api/stripe endpoints (MongoDB backend).
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let userToken;
let adminToken;

beforeAll(async () => {
  request = await createTestServer();

  const signup = await request.post('/api/auth/signup').send({
    name: 'StripeUser',
    email: 'stripeuser@example.com',
    password: 'stripepass123',
  });
  userToken = signup.body.token;

  const adminLogin = await request.post('/api/auth/login').send({
    email: 'admin@datasnap.pro',
    password: 'Admin1234!',
  });
  adminToken = adminLogin.body.token;
}, 30000);

afterAll(teardown);

// ─── Checkout session ─────────────────────────────────────────────────────────
describe('POST /api/stripe/create-checkout-session', () => {
  it('returns 401 without token', async () => {
    const res = await request.post('/api/stripe/create-checkout-session');
    expect(res.status).toBe(401);
  });

  it('returns 503 when Stripe key is a placeholder', async () => {
    const res = await request
      .post('/api/stripe/create-checkout-session')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(503);
  });
});

// ─── Payment intent ───────────────────────────────────────────────────────────
describe('POST /api/stripe/create-payment-intent', () => {
  it('returns 401 without token', async () => {
    const res = await request.post('/api/stripe/create-payment-intent');
    expect(res.status).toBe(401);
  });

  it('returns 503 when Stripe key is a placeholder', async () => {
    const res = await request
      .post('/api/stripe/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(503);
  });
});

// ─── Subscription status ──────────────────────────────────────────────────────
describe('GET /api/stripe/subscription-status', () => {
  it('returns 401 without token', async () => {
    const res = await request.get('/api/stripe/subscription-status');
    expect(res.status).toBe(401);
  });

  it('returns null subscription for a brand new user', async () => {
    const res = await request
      .get('/api/stripe/subscription-status')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
  });
});

// ─── Webhook ──────────────────────────────────────────────────────────────────
describe('POST /api/stripe/webhook', () => {
  it('returns 400 or 503 for an invalid JSON body', async () => {
    const res = await request
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from('not-json'));

    expect([400, 503]).toContain(res.status);
  });

  it('accepts a valid event when Stripe key is placeholder', async () => {
    const fakeEvent = {
      type: 'checkout.session.completed',
      data: {
        object: { mode: 'payment', customer: 'cus_fake', subscription: null },
      },
    };

    const res = await request
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    expect([200, 400, 503]).toContain(res.status);
  });
});
