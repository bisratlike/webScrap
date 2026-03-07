'use strict';
/**
 * testServer.js  (MongoDB Docker edition)
 *
 * Uses the MongoDB instance running in Docker (localhost:27017).
 * Each test file gets a UNIQUE database name so they are fully isolated.
 */

const mongoose = require('mongoose');

// Build a unique database name per test worker process + timestamp
let _dbName = null;

/**
 * Connect to the Docker MongoDB, seed admin, return supertest agent.
 * Call in beforeAll(); must call teardown() in afterAll().
 */
async function createTestServer() {
  _dbName = `datasnap_test_${process.pid}_${Date.now()}`;
  const uri = `mongodb://127.0.0.1:27017/${_dbName}`;

  // ── Set env vars BEFORE loading any backend modules ─────────────────────
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET  = 'test-jwt-secret-at-least-32-chars!!';
  process.env.NODE_ENV    = 'test';
  if (!process.env.STRIPE_SECRET_KEY)
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  // Exact placeholder string the service checks for
  if (!process.env.GEMINI_API_KEY)
    process.env.GEMINI_API_KEY = 'your-gemini-api-key-here';

  // ── Fresh module graph so env vars are picked up ─────────────────────────
  jest.resetModules();

  // ── Connect Mongoose ─────────────────────────────────────────────────────
  const { connectDb } = require('../../../backend/config/db');
  await connectDb(uri);

  // ── Seed admin user ───────────────────────────────────────────────────────
  const seedAdmin = require('../../../backend/utils/seedAdmin');
  await seedAdmin();

  // ── Build Express app ─────────────────────────────────────────────────────
  const createApp = require('../../../backend/app');
  const app = createApp();

  const supertest = require('supertest');
  return supertest(app);
}

/**
 * Disconnect Mongoose and drop the test database.
 */
async function teardown() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  } catch { /* ignore */ }
}

module.exports = { createTestServer, teardown };
