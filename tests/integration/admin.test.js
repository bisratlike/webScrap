'use strict';
/**
 * admin.test.js
 * Black-box integration tests for /api/admin endpoints (MongoDB backend).
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let adminToken;
let userToken;

beforeAll(async () => {
  request = await createTestServer();

  const adminLogin = await request.post('/api/auth/login').send({
    email: 'admin@datasnap.pro',
    password: 'Admin1234!',
  });
  adminToken = adminLogin.body.token;

  const userSignup = await request.post('/api/auth/signup').send({
    name: 'RegularUser',
    email: 'regular@example.com',
    password: 'regular123',
  });
  userToken = userSignup.body.token;
}, 30000);

afterAll(teardown);

// ─── Access control ───────────────────────────────────────────────────────────
describe('Admin endpoints — access control', () => {
  const adminRoutes = [
    ['GET',  '/api/admin/dashboard'],
    ['GET',  '/api/admin/users'],
    ['GET',  '/api/admin/subscriptions'],
    ['GET',  '/api/admin/usage'],
    ['GET',  '/api/admin/installs'],
  ];

  it.each(adminRoutes)(
    '%s %s returns 401 with no token',
    async (method, route) => {
      const res = await request[method.toLowerCase()](route);
      expect(res.status).toBe(401);
    }
  );

  it.each(adminRoutes)(
    '%s %s returns 403 for a regular user',
    async (method, route) => {
      const res = await request[method.toLowerCase()](route)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    }
  );
});

// ─── Dashboard ────────────────────────────────────────────────────────────────
describe('GET /api/admin/dashboard', () => {
  it('returns all expected stat keys', async () => {
    const res = await request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalUsers).toBe('number');
    expect(typeof res.body.activeSubscriptions).toBe('number');
    expect(typeof res.body.totalRevenue).toBe('number');
    expect(typeof res.body.totalInstalls).toBe('number');
    expect(Array.isArray(res.body.recentSignups)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);
  });

  it('counts at least the seeded admin + regular user', async () => {
    const res = await request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('does not expose password hashes in recentSignups', async () => {
    const res = await request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    for (const u of res.body.recentSignups) {
      expect(u.passwordHash).toBeUndefined();
    }
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  it('returns total, page, limit, users array', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  it('supports search query', async () => {
    const res = await request
      .get('/api/admin/users?search=admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.some(u => u.email.includes('admin'))).toBe(true);
  });

  it('no user exposes passwordHash', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    for (const u of res.body.users) {
      expect(u.passwordHash).toBeUndefined();
    }
  });
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
describe('GET /api/admin/subscriptions', () => {
  it('returns subscription list shape', async () => {
    const res = await request
      .get('/api/admin/subscriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
  });
});

// ─── Usage ────────────────────────────────────────────────────────────────────
describe('GET /api/admin/usage', () => {
  it('returns byAction and byDay arrays', async () => {
    const res = await request
      .get('/api/admin/usage')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.byAction)).toBe(true);
    expect(Array.isArray(res.body.byDay)).toBe(true);
  });
});

// ─── Installs ─────────────────────────────────────────────────────────────────
describe('GET /api/admin/installs', () => {
  it('returns total, byDay, recent', async () => {
    const res = await request
      .get('/api/admin/installs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(Array.isArray(res.body.byDay)).toBe(true);
    expect(Array.isArray(res.body.recent)).toBe(true);
  });
});

// ─── Role change ──────────────────────────────────────────────────────────────
describe('POST /api/admin/users/:id/role', () => {
  let targetUserId;

  beforeAll(async () => {
    const res = await request.post('/api/auth/signup').send({
      name: 'RoleTarget',
      email: 'roletarget@example.com',
      password: 'pass1234',
    });
    targetUserId = res.body.user.id;
  });

  it('changes a user role to admin', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
  });

  it('changes back to user', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('user');
  });

  it('returns 400 for an invalid role value', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });

  it('returns 403 when a regular user tries to change roles', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(403);
  });
});
