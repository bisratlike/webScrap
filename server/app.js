'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { config } = require('dotenv');

// Load .env before anything else
config();

const { initDb } = require('./db/database');
const authRouter = require('./routes/auth');
const stripeRouter = require('./routes/stripe');
const aiRouter = require('./routes/ai');
const adminRouter = require('./routes/admin');
const installsRouter = require('./routes/installs');

const app = express();

// Stripe webhook needs raw body — MUST be registered before json middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.WEBSITE_URL || 'http://localhost:3000',
    ];
    // Allow Chrome extensions and no-origin requests (server-to-server, curl)
    if (!origin || allowed.includes(origin) || /^chrome-extension:\/\//.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// JSON body parsing (after raw webhook route)
app.use(express.json());

// Serve static website files
const websiteDir = path.join(__dirname, '../website');
app.use(express.static(websiteDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/ai', aiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/installs', installsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// SPA fallback — serve website index.html for all non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(websiteDir, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(PORT, () => console.log(`DataSnap Pro server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
