'use strict';
/**
 * ai.test.js
 * Black-box integration tests for /api/ai endpoints (MongoDB backend).
 * Tests auth gate, subscription gate, pattern analysis, and AI key gate.
 */

const { createTestServer, teardown } = require('./helpers/testServer');

let request;
let userToken;
let adminToken;

beforeAll(async () => {
  request = await createTestServer();

  const signup = await request.post('/api/auth/signup').send({
    name: 'AIUser',
    email: 'aiuser@example.com',
    password: 'aipass123',
  });
  userToken = signup.body.token;

  const adminLogin = await request.post('/api/auth/login').send({
    email: 'admin@datasnap.pro',
    password: 'Admin1234!',
  });
  adminToken = adminLogin.body.token;
}, 30000);

afterAll(teardown);

// ─── /api/ai/analyze ─────────────────────────────────────────────────────────
describe('POST /api/ai/analyze', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/ai/analyze').send({ prompt: 'test' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user without subscription', async () => {
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'Summarize this page', mode: 'summarize' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/subscription/i);
  });

  it('returns 400 when both prompt and pageContent are missing', async () => {
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'summarize' });
    expect(res.status).toBe(400);
  });

  it('returns 503 when Gemini key is a placeholder', async () => {
    const res = await request
      .post('/api/ai/analyze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ prompt: 'Hello world', mode: 'summarize' });
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
      .send({ pageContent: '<html>hello</html>', extractionGoal: 'products' });
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

// ─── /api/ai/pattern-analyze (free endpoint) ─────────────────────────────────
describe('POST /api/ai/pattern-analyze', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request.post('/api/ai/pattern-analyze').send({
      pageContent: '<ul><li>Item 1</li></ul>',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when pageContent is missing', async () => {
    const res = await request
      .post('/api/ai/pattern-analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 with pattern analysis for regular user (no subscription needed)', async () => {
    const html = `
      <ul>
        <li class="product-item"><span class="price">$10</span><span class="title">Widget A</span></li>
        <li class="product-item"><span class="price">$20</span><span class="title">Widget B</span></li>
        <li class="product-item"><span class="price">$30</span><span class="title">Widget C</span></li>
      </ul>
    `;
    const res = await request
      .post('/api/ai/pattern-analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pageContent: html });

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(Array.isArray(res.body.patterns)).toBe(true);
    expect(Array.isArray(res.body.suggestedSelectors)).toBe(true);
    expect(res.body.schema).toBeDefined();
  });

  it('detects price and title selectors from HTML', async () => {
    const html = `
      <div class="product-card">
        <h2 class="product-title">Laptop</h2>
        <span class="price-tag">$999</span>
        <img class="product-image" src="x.jpg" />
        <a class="product-link" href="/laptop">View</a>
      </div>
      <div class="product-card">
        <h2 class="product-title">Phone</h2>
        <span class="price-tag">$599</span>
        <img class="product-image" src="y.jpg" />
        <a class="product-link" href="/phone">View</a>
      </div>
      <div class="product-card">
        <h2 class="product-title">Tablet</h2>
        <span class="price-tag">$399</span>
        <img class="product-image" src="z.jpg" />
        <a class="product-link" href="/tablet">View</a>
      </div>
    `;
    const res = await request
      .post('/api/ai/pattern-analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pageContent: html });

    expect(res.status).toBe(200);
    const selectors = res.body.suggestedSelectors;
    const names = selectors.map(s => s.name);
    expect(names).toContain('price');
    expect(names).toContain('title');
  });

  it('returns schema with field definitions', async () => {
    const html = `
      <article class="blog-post">
        <h1 class="post-title">Title A</h1>
        <span class="author">John</span>
        <time class="post-date">2024-01-01</time>
      </article>
      <article class="blog-post">
        <h1 class="post-title">Title B</h1>
        <span class="author">Jane</span>
        <time class="post-date">2024-01-02</time>
      </article>
      <article class="blog-post">
        <h1 class="post-title">Title C</h1>
        <span class="author">Bob</span>
        <time class="post-date">2024-01-03</time>
      </article>
    `;
    const res = await request
      .post('/api/ai/pattern-analyze')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pageContent: html });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.schema.fields)).toBe(true);
    expect(typeof res.body.schema.confidence).toBe('string');
  });

  it('handles admin user (no subscription needed either)', async () => {
    const res = await request
      .post('/api/ai/pattern-analyze')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pageContent: '<p>Simple page</p>' });
    expect(res.status).toBe(200);
  });
});
