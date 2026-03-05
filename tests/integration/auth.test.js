'use strict';
/**
 * auth.test.js
 * Black-box integration tests for /api/auth endpoints.
 * Tests the full HTTP layer: request parsing, validation, DB interaction,
 * JWT issuance and verification — no internals exposed.
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;

beforeAll(async () => {
  request = await createTestServer();
}, 20000);

afterAll(teardown);

// ─── Health sanity ────────────────────────────────────────────────────────────
describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
  });
});

// ─── Signup ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/signup', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'Secret123!' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.role).toBe('user');
    // password_hash must never be returned
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('normalises email to lowercase', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Bob', email: 'BOB@EXAMPLE.COM', password: 'Secret123!' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('bob@example.com');
  });

  it('returns 409 when email is already taken', async () => {
    await request
      .post('/api/auth/signup')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'pass1' });

    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Carol2', email: 'carol@example.com', password: 'pass2' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ email: 'noname@example.com', password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Dave', password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Eve', email: 'eve@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when body is empty', async () => {
    const res = await request.post('/api/auth/signup').send({});
    expect(res.status).toBe(400);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  const creds = { email: 'logintest@example.com', password: 'MyPass99!' };

  beforeAll(async () => {
    await request
      .post('/api/auth/signup')
      .send({ name: 'LoginUser', ...creds });
  });

  it('returns token and user for valid credentials', async () => {
    const res = await request.post('/api/auth/login').send(creds);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(creds.email);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('accepts email in any case (case-insensitive)', async () => {
    const res = await request.post('/api/auth/login').send({
      email: creds.email.toUpperCase(),
      password: creds.password,
    });
    expect(res.status).toBe(200);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: creds.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'anything',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request.post('/api/auth/login').send({ password: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request.post('/api/auth/login').send({ email: creds.email });
    expect(res.status).toBe(400);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('returns 200 regardless of auth state', async () => {
    const res = await request.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── /me ──────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'MeUser', email: 'meuser@example.com', password: 'pw123' });
    token = res.body.token;
  });

  it('returns the current user when authenticated', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('meuser@example.com');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 401 with no token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 403 with a tampered token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.bad.payload');
    expect(res.status).toBe(403);
  });
});

// ─── Admin seeded user ────────────────────────────────────────────────────────
describe('Admin seeded user', () => {
  it('can log in with seeded admin credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'admin@datasnap.pro',
      password: 'Admin1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeDefined();
  });
});
