/**
 * website.spec.js
 * End-to-end black box tests for the DataSnap Pro website.
 * Uses Playwright to drive a real Chromium browser against the running Express
 * server.  No internals are accessed — only the public HTTP/HTML interface.
 */

const { test, expect } = require('@playwright/test');

// ─── Landing page ─────────────────────────────────────────────────────────────
test.describe('Landing page (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/DataSnap Pro/i);
  });

  test('nav bar contains the logo and key links', async ({ page }) => {
    await expect(page.locator('.nav-logo')).toContainText('DataSnap Pro');
    // Scope to nav to avoid matching footer links with same href
    await expect(page.locator('.nav a[href="/login.html"]')).toBeVisible();
    await expect(page.locator('.nav a[href="/register.html"]').first()).toBeVisible();
  });

  test('hero section is visible with headline and CTA buttons', async ({ page }) => {
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('Extract Web Data');
    // At least one CTA button pointing to register
    const ctaButtons = page.locator('a[href="/register.html"]');
    expect(await ctaButtons.count()).toBeGreaterThanOrEqual(1);
  });

  test('features section is rendered with 6 feature cards', async ({ page }) => {
    await page.locator('#features').scrollIntoViewIfNeeded();
    const cards = page.locator('.feature-card');
    await expect(cards).toHaveCount(6);
  });

  test('how-it-works section is visible', async ({ page }) => {
    await page.locator('#how-it-works').scrollIntoViewIfNeeded();
    await expect(page.locator('#how-heading')).toBeVisible();
  });

  test('pricing section shows $3/month', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const pricingSection = page.locator('#pricing');
    await expect(pricingSection).toContainText('3');
    await expect(pricingSection).toContainText('month');
  });

  test('pricing CTA links to register page', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const cta = page.locator('#pricing a[href="/register.html"]').first();
    await expect(cta).toBeVisible();
  });

  test('footer is present', async ({ page }) => {
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('navigation #features anchor scrolls to features section', async ({ page }) => {
    // Scope to nav to avoid strict-mode violation (footer may also have the link)
    await page.locator('.nav a[href="#features"]').first().click();
    // After clicking the anchor the URL hash should change
    await page.waitForURL('**/#features', { timeout: 3000 });
    expect(page.url()).toContain('#features');
  });

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

// ─── Register page ────────────────────────────────────────────────────────────
test.describe('Register page (register.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register.html');
  });

  test('page renders the registration form', async ({ page }) => {
    await expect(page.locator('#register-form')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();
  });

  test('plan summary / pricing info is visible on the page', async ({ page }) => {
    // The page should mention the plan pricing
    const body = await page.locator('body').textContent();
    expect(body).toMatch(/\$3/);
  });

  test('shows validation error when all fields are empty and form is submitted', async ({ page }) => {
    await page.locator('#submit-btn').click();
    // JS validation creates .field-error spans dynamically; wait for first one
    await expect(page.locator('.field-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'pw_mismatch@test.com');
    await page.fill('#password', 'Password1!');
    await page.fill('#confirm-password', 'DifferentPass1!');
    await page.locator('#submit-btn').click();

    // Expect some error visible
    const pageText = await page.locator('body').textContent();
    expect(pageText.toLowerCase()).toMatch(/password|match/);
  });

  test('password toggle shows/hides password', async ({ page }) => {
    await page.fill('#password', 'MySecret');
    // Initially type=password
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    // Click toggle
    await page.locator('#pw-toggle').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    // Click again to hide
    await page.locator('#pw-toggle').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  test('"Already have an account?" link points to login page', async ({ page }) => {
    const loginLink = page.locator('a[href="/login.html"]').first();
    await expect(loginLink).toBeVisible();
  });
});

// ─── Login page ───────────────────────────────────────────────────────────────
test.describe('Login page (login.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
  });

  test('page renders login form', async ({ page }) => {
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();
  });

  test('shows error for empty form submission', async ({ page }) => {
    await page.locator('#submit-btn').click();
    // JS validation creates .field-error spans dynamically
    await expect(page.locator('.field-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.fill('#email', 'not-an-email');
    await page.fill('#password', 'anything');
    await page.locator('#submit-btn').click();
    // An error mentioning email should appear
    const pageText = await page.locator('body').textContent();
    expect(pageText.toLowerCase()).toMatch(/email/);
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.fill('#email', 'nobody@nobody.com');
    await page.fill('#password', 'wrongpassword');
    await page.locator('#submit-btn').click();

    // Wait for the async API response
    const alert = page.locator('#form-alert');
    await expect(alert).toBeVisible({ timeout: 5000 });
    await expect(alert).not.toBeEmpty();
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.fill('#password', 'Secret');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await page.locator('#pw-toggle').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  });

  test('"Don\'t have an account?" link points to register page', async ({ page }) => {
    const registerLink = page.locator('a[href="/register.html"]').first();
    await expect(registerLink).toBeVisible();
  });

  test('successful admin login redirects to dashboard', async ({ page }) => {
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();

    // Should redirect to dashboard.html
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });
    expect(page.url()).toContain('dashboard.html');
  });
});

// ─── Admin dashboard page ─────────────────────────────────────────────────────
test.describe('Admin dashboard (dashboard.html)', () => {
  test('redirects to login.html when not authenticated', async ({ page }) => {
    // Clear any stored auth
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/dashboard.html');
    // Should be redirected to login
    await page.waitForURL('**/login.html', { timeout: 5000 });
    expect(page.url()).toContain('login.html');
  });

  test('loads dashboard data when authenticated as admin', async ({ page }) => {
    // Log in first
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    // Stat cards should be filled in (not showing placeholder "—")
    await page.waitForFunction(
      () => document.getElementById('stat-users')?.textContent !== '—',
      { timeout: 8000 }
    );

    const usersText = await page.locator('#stat-users').textContent();
    expect(Number(usersText)).toBeGreaterThanOrEqual(1);
  });

  test('overview tab is active by default', async ({ page }) => {
    // Navigate directly to dashboard using stored token from previous test
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    // #tab-overview should have class "active"
    const overviewPanel = page.locator('#tab-overview');
    await expect(overviewPanel).toHaveClass(/active/);
  });

  test('can switch to Users tab and table renders', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    // Click Users tab
    await page.locator('a[data-tab="users"]').click();

    // Users tab panel should become active
    await expect(page.locator('#tab-users')).toHaveClass(/active/, { timeout: 5000 });

    // Wait for rows
    await page.waitForFunction(
      () => document.querySelectorAll('#users-table-body tr').length > 0,
      { timeout: 8000 }
    );
    const rows = await page.locator('#users-table-body tr').count();
    expect(rows).toBeGreaterThanOrEqual(1);
  });

  test('can switch to Subscriptions tab', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    await page.locator('a[data-tab="subscriptions"]').click();
    await expect(page.locator('#tab-subscriptions')).toHaveClass(/active/, { timeout: 5000 });
  });

  test('can switch to Usage tab', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    await page.locator('a[data-tab="usage"]').click();
    await expect(page.locator('#tab-usage')).toHaveClass(/active/, { timeout: 5000 });
  });

  test('can switch to Installs tab', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    await page.locator('a[data-tab="installs"]').click();
    await expect(page.locator('#tab-installs')).toHaveClass(/active/, { timeout: 5000 });
  });

  test('logout button clears session and redirects to login', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('#email', 'admin@datasnap.pro');
    await page.fill('#password', 'Admin1234!');
    await page.locator('#submit-btn').click();
    await page.waitForURL('**/dashboard.html', { timeout: 8000 });

    await page.locator('#logout-btn').click();
    await page.waitForURL('**/login.html', { timeout: 5000 });
    expect(page.url()).toContain('login.html');
  });
});

// ─── Success page ─────────────────────────────────────────────────────────────
test.describe('Success page (success.html)', () => {
  test('renders the confirmation UI', async ({ page }) => {
    await page.goto('/success.html');
    await expect(page.locator('.success-icon')).toBeVisible();
    await expect(page.locator('.success-card')).toBeVisible();
    // Use .success-actions to scope — nav logo also uses href="/"
    await expect(page.locator('.success-actions a[href="/"]')).toBeVisible();
  });

  test('contains positive confirmation text', async ({ page }) => {
    await page.goto('/success.html');
    const text = await page.locator('body').textContent();
    expect(text.toLowerCase()).toMatch(/set|subscri|success|active|started/i);
  });
});

// ─── API health check via browser ────────────────────────────────────────────
test.describe('API health endpoint', () => {
  test('returns JSON with status ok', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

// ─── Register flow via API (black-box) ───────────────────────────────────────
test.describe('Full register + subscription-check flow via API', () => {
  let token;
  const user = {
    name: 'E2E TestUser',
    // Combine timestamp + process.pid for a collision-resistant unique email
    email: `e2e_${Date.now()}_${process.pid}@test.com`,
    password: 'E2ePass!99',
  };

  test('signup returns a JWT token', async ({ request }) => {
    const res = await request.post('/api/auth/signup', { data: user });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.token).toBeDefined();
    token = body.token;
  });

  test('login with the new account returns a token', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
  });

  test('subscription status is null for a brand new user', async ({ request }) => {
    const res = await request.get('/api/stripe/subscription-status', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.subscription).toBeNull();
  });

  test('AI analyze returns 403 (subscription required) for new user', async ({ request }) => {
    const res = await request.post('/api/ai/analyze', {
      data: { prompt: 'Summarize', mode: 'summarize' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
