import { test, expect, Page } from '@playwright/test';

/**
 * Phase 1: Register — E2E Tests
 *
 * Tests the full registration flow:
 *  1. Navigate to /login page
 *  2. Fill email + password
 *  3. Click Register
 *  4. Verify success toast appears
 *  5. Verify redirect to /home
 *  6. Verify authenticated UI elements appear (tab bar)
 *
 * Pre-requisites:
 *  - Frontend dev server running on localhost:4200
 *  - Backend running on localhost:3000
 *  - Database running and accessible
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(): string {
  return `e2e-register-${Date.now()}@test.com`;
}

/** Wait for Ionic page to be fully hydrated */
async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  // Small buffer for Ionic animations to settle
  await page.waitForTimeout(500);
}

/** Clear auth state so each test starts logged out */
async function clearAuth(page: Page) {
  await page.evaluate(() => localStorage.removeItem('access_token'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 1: Register', () => {

  test.beforeEach(async ({ page }) => {
    // Start every test logged out
    await page.goto('/login');
    await clearAuth(page);
    await page.reload();
    await waitForIonicReady(page);
  });

  // -----------------------------------------------------------------------
  // 1. Login page renders correctly
  // -----------------------------------------------------------------------
  test('should display the login page with all form elements', async ({ page }) => {
    // Header title
    await expect(page.locator('ion-title')).toContainText('Login');

    // Email + Password fields
    const emailInput = page.locator('ion-input[type="email"]');
    const passwordInput = page.locator('ion-input[type="password"]');
    await expect(emailInput).toBeVisible({ timeout: 5_000 });
    await expect(passwordInput).toBeVisible({ timeout: 5_000 });

    // Both buttons
    const signInBtn = page.locator('ion-button', { hasText: 'Sign in' });
    const registerBtn = page.locator('ion-button', { hasText: 'Register' });
    await expect(signInBtn).toBeVisible();
    await expect(registerBtn).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 2. Registration with valid credentials succeeds
  // -----------------------------------------------------------------------
  test('should register a new user and redirect to /home', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    // Fill the form — Ionic wraps <input> inside shadow DOM of <ion-input>
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);

    // Click Register
    await page.locator('ion-button', { hasText: 'Register' }).click();

    // Expect success toast
    const toast = page.locator('ion-toast');
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Expect navigation to /home (wait for URL change)
    await page.waitForURL('**/home', { timeout: 10_000 });
    expect(page.url()).toContain('/home');
  });

  // -----------------------------------------------------------------------
  // 3. After registration, authenticated UI elements are visible
  //    (uses mobile viewport — tab bar has ion-hide-lg-up so it's hidden on desktop)
  // -----------------------------------------------------------------------
  test('should show tab bar after successful registration', async ({ page }) => {
    // Resize to mobile viewport so the ion-hide-lg-up footer becomes visible
    await page.setViewportSize({ width: 390, height: 844 });

    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Register' }).click();

    // Wait for authenticated layout
    await page.waitForURL('**/home', { timeout: 10_000 });
    await waitForIonicReady(page);

    // Tab bar should be visible on mobile
    const tabBar = page.locator('ion-footer.mobile-tabs');
    await expect(tabBar).toBeVisible({ timeout: 5_000 });

    // All 4 tab buttons should be present
    const homeTab = page.locator('.tab-button', { hasText: /home/i });
    const teamsTab = page.locator('.tab-button', { hasText: /teams/i });
    const feedTab = page.locator('.tab-button', { hasText: /feed/i });

    await expect(homeTab).toBeVisible();
    await expect(teamsTab).toBeVisible();
    await expect(feedTab).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 4. Registration with empty fields shows validation feedback
  // -----------------------------------------------------------------------
  test('should not register with empty email and password', async ({ page }) => {
    // Click Register without filling anything
    await page.locator('ion-button', { hasText: 'Register' }).click();

    // Should stay on login page (register() has early return for empty fields)
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/login');
  });

  // -----------------------------------------------------------------------
  // 5. Registration with duplicate email shows error
  // -----------------------------------------------------------------------
  test('should show error toast when registering with duplicate email', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    // Register first time (via API to be fast)
    const resp = await page.request.post('/api/auth/register', {
      data: { email, password },
    });
    expect(resp.ok()).toBeTruthy();

    // Clear token from first registration
    await clearAuth(page);
    await page.reload();
    await waitForIonicReady(page);

    // Try registering again with same email via UI
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Register' }).click();

    // Expect an error toast (color="danger")
    const errorToast = page.locator('ion-toast[color="danger"]');
    await expect(errorToast).toBeVisible({ timeout: 5_000 });

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  // -----------------------------------------------------------------------
  // 6. Token is stored in localStorage after registration
  // -----------------------------------------------------------------------
  test('should store JWT token in localStorage after registration', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Register' }).click();

    await page.waitForURL('**/home', { timeout: 10_000 });

    // Verify token exists
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    expect(token!.split('.').length).toBe(3); // JWT has 3 parts
  });
});
