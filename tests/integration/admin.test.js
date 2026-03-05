'use strict';
/**
 * admin.test.js
 * Black-box integration tests for /api/admin endpoints.
 * Verifies access control, data shape and pagination — no internals exposed.
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let adminToken;
let userToken;

beforeAll(async () => {
  request = await createTestServer();

  // Log in as the seeded admin
  const adminLogin = await request.post('/api/auth/login').send({
    email: 'admin@datasnap.pro',
    password: 'Admin1234!',
  });
  adminToken = adminLogin.body.token;

  // Create a regular user
  const userSignup = await request.post('/api/auth/signup').send({
    name: 'RegularUser',
    email: 'regular@example.com',
    password: 'regular123',
  });
  userToken = userSignup.body.token;
}, 20000);

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

  it('counts at least the seeded admin + regular user in totalUsers', async () => {
    const res = await request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    // We created admin (seed) + regular user in beforeAll
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('recentSignups does not expose password_hash', async () => {
    const res = await request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    res.body.recentSignups.forEach(u => {
      expect(u.password_hash).toBeUndefined();
    });
  });
});

// ─── Users list ───────────────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  it('returns paginated user list', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(typeof res.body.page).toBe('number');
    expect(typeof res.body.limit).toBe('number');
  });

  it('never exposes password_hash', async () => {
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    res.body.users.forEach(u => expect(u.password_hash).toBeUndefined());
  });

  it('supports pagination via page query param', async () => {
    const res = await request
      .get('/api/admin/users?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeLessThanOrEqual(1);
  });

  it('supports search query param', async () => {
    const res = await request
      .get('/api/admin/users?search=admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // At least the seeded admin should match
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);
    expect(res.body.users[0].email).toContain('admin');
  });
});

// ─── Subscriptions list ───────────────────────────────────────────────────────
describe('GET /api/admin/subscriptions', () => {
  it('returns paginated subscription list', async () => {
    const res = await request
      .get('/api/admin/subscriptions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(Array.isArray(res.body.subscriptions)).toBe(true);
  });

  it('supports status filter query param', async () => {
    const res = await request
      .get('/api/admin/subscriptions?status=active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // All returned subscriptions must have status active
    res.body.subscriptions.forEach(s => expect(s.status).toBe('active'));
  });
});

// ─── Usage stats ──────────────────────────────────────────────────────────────
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

// ─── Installs stats ───────────────────────────────────────────────────────────
describe('GET /api/admin/installs', () => {
  it('returns total, byDay and recent arrays', async () => {
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
    const usersRes = await request
      .get('/api/admin/users?search=regular')
      .set('Authorization', `Bearer ${adminToken}`);
    targetUserId = usersRes.body.users[0]?.id;
  });

  it('promotes a user to admin role', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('demotes back to user role', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    expect(res.status).toBe(200);
  });

  it('returns 400 for an invalid role value', async () => {
    const res = await request
      .post(`/api/admin/users/${targetUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'superuser' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent user id', async () => {
    const res = await request
      .post('/api/admin/users/999999/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'user' });

    expect(res.status).toBe(404);
  });
});
