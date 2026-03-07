'use strict';

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const apiRoutes   = require('./routes');
const errorHandler = require('./middleware/error.middleware');

/**
 * Create and configure the Express application.
 * Does NOT start listening – call server.js for that.
 *
 * @returns {express.Application}
 */
function createApp() {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────────
  // CSP is set to allow same-origin scripts/styles needed by the static website.
  // Inline scripts/styles in the website pages require 'unsafe-inline'.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
      },
    },
  }));

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      const allowed = [process.env.WEBSITE_URL || 'http://localhost:3000'];
      if (
        !origin ||
        allowed.includes(origin) ||
        /^chrome-extension:\/\//.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }));

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
  app.use('/api/', apiLimiter);

  // SPA page requests are also rate-limited to prevent filesystem-read abuse
  const pageLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });

  // ── Body parsing (JSON – webhook raw body handled per-route in stripe router)
  app.use(express.json());

  // ── Static website files ───────────────────────────────────────────────────
  const websiteDir = path.join(__dirname, '../website');
  app.use(express.static(websiteDir));

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use('/api', apiRoutes);

  // app.get('/{*splat}', ...) is Express v5 wildcard syntax
  app.get('/{*splat}', pageLimiter, (req, res) => {
    res.sendFile(path.join(websiteDir, 'index.html'), (err) => {
      if (err) res.status(404).json({ error: 'Not found' });
    });
  });

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
