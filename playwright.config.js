// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
const os = require('os');
const path = require('path');

// Unique temp DB for the e2e test run so it doesn't conflict with the dev DB
const testDbPath = path.join(os.tmpdir(), `datasnap_e2e_${Date.now()}.db`);

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 0,
  workers: 1,           // single worker — one server instance
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/playwright-html' }]],

  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },

  // Start the Express server before running e2e tests
  webServer: {
    command: [
      `DB_PATH=${testDbPath}`,
      'JWT_SECRET=e2e-test-jwt-secret-at-least-32-chars',
      'PORT=3001',
      'WEBSITE_URL=http://localhost:3001',
      'NODE_ENV=test',
      'STRIPE_SECRET_KEY=sk_test_placeholder',
      'GEMINI_API_KEY=your-gemini-api-key-here',
      'node server/app.js',
    ].join(' '),
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: false,
    timeout: 20000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
