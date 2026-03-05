'use strict';
/**
 * installs.test.js
 * Black-box integration tests for /api/installs endpoints.
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;

beforeAll(async () => {
  request = await createTestServer();
}, 20000);

afterAll(teardown);

// ─── Register ─────────────────────────────────────────────────────────────────
describe('POST /api/installs/register', () => {
  const extId = 'ext_blackbox_001';

  it('registers a new install and returns registered: true', async () => {
    const res = await request
      .post('/api/installs/register')
      .send({ extensionId: extId });

    expect(res.status).toBe(201);
    expect(res.body.registered).toBe(true);
  });

  it('returns registered: false and updated: true on duplicate registration', async () => {
    const res = await request
      .post('/api/installs/register')
      .send({ extensionId: extId });

    expect(res.status).toBe(200);
    expect(res.body.registered).toBe(false);
    expect(res.body.updated).toBe(true);
  });

  it('returns 400 when extensionId is missing', async () => {
    const res = await request.post('/api/installs/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('can register with an associated userId', async () => {
    // Create a user first
    const signup = await request.post('/api/auth/signup').send({
      name: 'InstallUser',
      email: 'installuser@example.com',
      password: 'pw1234',
    });
    const userId = signup.body.user.id;

    const res = await request.post('/api/installs/register').send({
      extensionId: 'ext_with_user',
      userId,
    });

    expect(res.status).toBe(201);
    expect(res.body.registered).toBe(true);
  });
});

// ─── Ping ─────────────────────────────────────────────────────────────────────
describe('POST /api/installs/ping', () => {
  it('returns ok: true for a known install', async () => {
    // Register first
    await request
      .post('/api/installs/register')
      .send({ extensionId: 'ext_ping_001' });

    const res = await request
      .post('/api/installs/ping')
      .send({ extensionId: 'ext_ping_001' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('auto-registers and returns ok: true on first ping for unknown install', async () => {
    const res = await request
      .post('/api/installs/ping')
      .send({ extensionId: 'ext_never_registered' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when extensionId is missing', async () => {
    const res = await request.post('/api/installs/ping').send({});
    expect(res.status).toBe(400);
  });

  it('reflects in admin installs count', async () => {
    // Login as admin
    const adminLogin = await request.post('/api/auth/login').send({
      email: 'admin@datasnap.pro',
      password: 'Admin1234!',
    });
    const adminToken = adminLogin.body.token;

    // Register a unique install
    await request.post('/api/installs/register').send({ extensionId: 'ext_count_check' });

    const installs = await request
      .get('/api/admin/installs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(installs.status).toBe(200);
    // At least one install exists
    expect(installs.body.total).toBeGreaterThanOrEqual(1);
  });
});
