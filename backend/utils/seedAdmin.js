'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Seed a default admin user if one does not already exist.
 * Called on every server start (idempotent).
 */
async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL    || 'admin@datasnap.pro';
  const name     = process.env.ADMIN_NAME     || 'Admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const existing = await User.findOne({ email });
  if (existing) return;

  // Hash before constructing the document so the pre-save hook
  // sees an already-hashed value and skips double-hashing.
  const hash = await bcrypt.hash(password, 10);

  // Bypass the pre-save hook by calling create() without modifying passwordHash
  await User.collection.insertOne({
    name,
    email,
    passwordHash: hash,
    role: 'admin',
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Admin user seeded: ${email}`);
}

module.exports = seedAdmin;
