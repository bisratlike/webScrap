'use strict';

/**
 * Centralised environment-variable validation.
 * Throws at startup if required vars are missing so the problem surfaces early.
 */
function validateEnv() {
  const required = ['JWT_SECRET'];
  const missing = required.filter(k => !process.env[k]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = { validateEnv };
