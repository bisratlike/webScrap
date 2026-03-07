'use strict';
/**
 * auth.test.js
 * Black-box integration tests for /api/auth endpoints (MongoDB backend).
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;

beforeAll(async () => {
  request = await createTestServer();
}, 30000);

afterAll(teardown);

// Health sanity
describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
  });
});

// Signup
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
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('normalises email to lowercase', async () => {
    const res = await request
      .post('/api/auth/signup')
      .send({ name: 'Bob', email: 'BOB@EXAMPLE.COM', password: 'Secret123!' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('bob@example.com');
  });

  it('returns 409 for a duplicate email', async () => {
    await request.post('/api/auth/signup').send({
      name: 'Dup', email: 'dup@example.com', password: 'pass1234',
    });
    const res = await request.post('/api/auth/signup').send({
      name: 'Dup2', email: 'dup@example.com', password: 'pass1234',
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request.post('/api/auth/signup')
      .send({ email: 'noname@example.com', password: 'pass1234' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request.post('/api/auth/signup')
      .send({ name: 'NoEmail', password: 'pass1234' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request.post('/api/auth/signup')
      .send({ name: 'NoPass', email: 'nopass@example.com' });
    expect(res.status).toBe(400);
  });
});

// Login
describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request.post('/api/auth/signup').send({
      name: 'LoginTest', email: 'logintest@example.com', password: 'testpass99',
    });
  });

  it('returns a token and user on valid credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'logintest@example.com', password: 'testpass99',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('logintest@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('accepts email in any case', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'LOGINTEST@EXAMPLE.COM', password: 'testpass99',
    });
    expect(res.status).toBe(200);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'logintest@example.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'testpass99',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request.post('/api/auth/login').send({ password: 'testpass99' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request.post('/api/auth/login').send({ email: 'logintest@example.com' });
    expect(res.status).toBe(400);
  });
});

// Logout
describe('POST /api/auth/logout', () => {
  it('returns success without a token', async () => {
    const res = await request.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// /me
describe('GET /api/auth/me', () => {
  let token;

  beforeAll(async () => {
    const res = await request.post('/api/auth/signup').send({
      name: 'MeTest', email: 'metest@example.com', password: 'mepass123',
    });
    token = res.body.token;
  });

  it('returns the authenticated user', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('metest@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 403 with a malformed token', async () => {
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(403);
  });
});

// Seeded admin
describe('Seeded admin account', () => {
  it('can log in with default credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'admin@datasnap.pro',
      password: 'Admin1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });
});
