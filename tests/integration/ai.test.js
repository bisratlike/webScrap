'use strict';
/**
 * ai.test.js
 * Black-box integration tests for /api/ai endpoints.
 * Tests authentication gate, subscription gate, and input validation.
 * Actual Gemini calls are NOT made (key is set to a placeholder).
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let userToken;
let adminToken;

beforeAll(async () => {
  request = await createTestServer();

  // Regular user (no subscription)
  const signup = await request.post('/api/auth/signup').send({
    name: 'AIUser',
    email: 'aiuser@example.com',
    password: 'aipass123',
  });
  userToken = signup.body.token;

  // Admin login
  const adminLogin = await request.post('/api/auth/login').send({
    email: 'admin@datasnap.pro',
    password: 'Admin1234!',
  });
  adminToken = adminLogin.body.token;
}, 20000);

afterAll(teardown);

// ─── /api/ai/analyze ─────────────────────────────────────────────────────────
describe('POST /api/ai/analyze', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/ai/analyze').send({
      prompt: 'test',
      mode: 'summarize',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user without an active subscription', async () => {
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'Summarize this page', mode: 'summarize' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/subscription/i);
  });

  it('returns 400 when both prompt and pageContent are missing', async () => {
    // Admin bypasses subscription gate
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'summarize' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 503 when Gemini API key is a placeholder (graceful error)', async () => {
    // Admin has no subscription gate but Gemini key is placeholder
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Hello world', mode: 'summarize' });

    // 503 because key = placeholder-gemini-key
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/gemini/i);
  });
});

// ─── /api/ai/smart-extract ───────────────────────────────────────────────────
describe('POST /api/ai/smart-extract', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/ai/smart-extract').send({
      pageContent: '<html>hello</html>',
      extractionGoal: 'product names',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user without subscription', async () => {
    const res = await request
      .post('/api/ai/smart-extract')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageContent: '<html>hello</html>',
        extractionGoal: 'product names',
      });
    expect(res.status).toBe(403);
  });

  it('returns 400 when pageContent is missing', async () => {
    const res = await request
      .post('/api/ai/smart-extract')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ extractionGoal: 'product names' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when extractionGoal is missing', async () => {
    const res = await request
      .post('/api/ai/smart-extract')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pageContent: '<html>hello</html>' });

    expect(res.status).toBe(400);
  });

  it('returns 503 when Gemini key is a placeholder', async () => {
    const res = await request
      .post('/api/ai/smart-extract')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pageContent: '<ul><li>Item 1</li><li>Item 2</li></ul>',
        extractionGoal: 'list items',
      });

    expect(res.status).toBe(503);
  });
});
