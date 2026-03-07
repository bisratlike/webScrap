'use strict';
/**
 * installs.test.js
 * Black-box integration tests for /api/installs endpoints (MongoDB backend).
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;

beforeAll(async () => {
  request = await createTestServer();
}, 30000);

afterAll(teardown);

// ─── Register ─────────────────────────────────────────────────────────────────
describe('POST /api/installs/register', () => {
  it('registers a new extension install', async () => {
    const res = await request
      .post('/api/installs/register')
      .send({ extensionId: 'ext-001' });

    expect(res.status).toBe(201);
    expect(res.body.registered).toBe(true);
  });

  it('updates last_seen on duplicate register', async () => {
    await request.post('/api/installs/register').send({ extensionId: 'ext-002' });
    const res = await request.post('/api/installs/register').send({ extensionId: 'ext-002' });

    expect(res.status).toBe(200);
    expect(res.body.registered).toBe(false);
    expect(res.body.updated).toBe(true);
  });

  it('returns 400 when extensionId is missing', async () => {
    const res = await request.post('/api/installs/register').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Ping ─────────────────────────────────────────────────────────────────────
describe('POST /api/installs/ping', () => {
  it('returns ok for a known extension', async () => {
    await request.post('/api/installs/register').send({ extensionId: 'ext-ping-1' });
    const res = await request.post('/api/installs/ping').send({ extensionId: 'ext-ping-1' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('auto-registers on first ping', async () => {
    const res = await request.post('/api/installs/ping').send({ extensionId: 'ext-new-ping' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when extensionId is missing', async () => {
    const res = await request.post('/api/installs/ping').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Admin reflects install count ─────────────────────────────────────────────
describe('Install count reflected in admin stats', () => {
  let adminToken;

  beforeAll(async () => {
    const adminLogin = await request.post('/api/auth/login').send({
      email: 'admin@datasnap.pro',
      password: 'Admin1234!',
    });
    adminToken = adminLogin.body.token;
  });

  it('admin /installs total increases after registrations', async () => {
    const before = await request
      .get('/api/admin/installs')
      .set('Authorization', `Bearer ${adminToken}`);
    const beforeCount = before.body.total;

    await request.post('/api/installs/register').send({ extensionId: `ext-count-${Date.now()}` });

    const after = await request
      .get('/api/admin/installs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(after.body.total).toBe(beforeCount + 1);
  });
});
