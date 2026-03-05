'use strict';
/**
 * testServer.js
 * Boots the Express app with an isolated in-memory SQLite database so every
 * test file starts with a clean slate without touching the production DB.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

let _testDbPath = null;

/**
 * Returns a fresh supertest agent backed by an isolated test database.
 * Call once per test file (in beforeAll). Must call teardown() in afterAll.
 */
async function createTestServer() {
  // Use a unique temp file so parallel test workers don't collide
  _testDbPath = path.join(os.tmpdir(), `datasnap_test_${process.pid}_${Date.now()}.db`);

  // Point the server at the temp database and set test env vars
  process.env.DB_PATH = _testDbPath;
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars!!';
  process.env.NODE_ENV = 'test';
  // Keep Stripe/Gemini keys as placeholders so optional integrations return 503
  if (!process.env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  // Use the exact placeholder string the server's getGeminiClient() checks for
  if (!process.env.GEMINI_API_KEY)    process.env.GEMINI_API_KEY    = 'your-gemini-api-key-here';

  // Each test file needs a fresh module graph to pick up the new DB_PATH
  jest.resetModules();

  const { initDb } = require('../../../server/db/database');
  await initDb();

  const app = require('../../../server/app');
  const supertest = require('supertest');
  return supertest(app);
}

/**
 * Remove the temp database file after tests finish.
 */
function teardown() {
  if (_testDbPath && fs.existsSync(_testDbPath)) {
    try { fs.unlinkSync(_testDbPath); } catch (err) {
      if (err.code !== 'ENOENT') console.warn('teardown: could not remove db file:', err.message);
    }
  }
  // Also remove the WAL files
  ['-wal', '-shm'].forEach(ext => {
    const f = _testDbPath + ext;
    if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch (err) {
      if (err.code !== 'ENOENT') console.warn('teardown: could not remove', ext, 'file:', err.message);
    }
  });
}

module.exports = { createTestServer, teardown };
