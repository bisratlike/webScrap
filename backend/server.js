'use strict';

require('dotenv').config();

const { validateEnv } = require('./config/env');
const { connectDb }   = require('./config/db');
const createApp       = require('./app');
const seedAdmin       = require('./utils/seedAdmin');

async function start() {
  validateEnv();

  await connectDb();
  await seedAdmin();

  const app  = createApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`DataSnap Pro backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
