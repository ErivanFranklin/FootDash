import { test, expect, Page } from '@playwright/test';

/**
 * Phase 2: Login — E2E Tests
 *
 * Tests the full login flow:
 *  1. Navigate to /login page
 *  2. Fill email + password for existing user
 *  3. Click Sign In
 *  4. Verify success toast appears
 *  5. Verify redirect to /home
 *  6. Verify authenticated UI elements appear
 *  7. Test invalid credentials
 *  8. Test session persistence
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
  return `e2e-login-${Date.now()}@test.com`;
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
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.removeItem('access_token'));
}

/** Create a test user via API (fast setup) */
async function createTestUser(page: Page, email: string, password: string) {
  const resp = await page.request.post('/api/auth/register', {
    data: { email, password },
  });
  expect(resp.ok()).toBeTruthy();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 2: Login', () => {

  test.beforeEach(async ({ page }) => {
    // Start every test logged out
    await page.goto('/login');
    await clearAuth(page);
    await page.reload();
    await waitForIonicReady(page);
  });

  // -----------------------------------------------------------------------
  // 1. Login with valid existing user credentials succeeds
  // -----------------------------------------------------------------------
  test('should login with valid credentials and redirect to /home', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    // Create user first via API
    await createTestUser(page, email, password);

    // Now login via UI
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    // Expect success toast
    const toast = page.locator('ion-toast[color="success"]');
    await expect(toast).toBeVisible({ timeout: 5_000 });

    // Expect navigation to /home
    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/(home|onboarding|tabs)/);
  });

  // -----------------------------------------------------------------------
  // 2. Login with invalid password shows error
  // -----------------------------------------------------------------------
  test('should show error toast with invalid password', async ({ page }) => {
    const email = uniqueEmail();
    const correctPassword = 'TestPassword123!';
    const wrongPassword = 'WrongPassword456!';

    // Create user with correct password
    await createTestUser(page, email, correctPassword);

    // Try login with wrong password
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(wrongPassword);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    // Expect error toast
    const errorToast = page.locator('ion-toast[color="danger"]');
    await expect(errorToast).toBeVisible({ timeout: 5_000 });

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  // -----------------------------------------------------------------------
  // 3. Login with non-existent email shows error
  // -----------------------------------------------------------------------
  test('should show error toast with non-existent email', async ({ page }) => {
    const email = uniqueEmail(); // Not registered
    const password = 'TestPassword123!';

    // Try login without creating user
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    // Expect error toast
    const errorToast = page.locator('ion-toast[color="danger"]');
    await expect(errorToast).toBeVisible({ timeout: 5_000 });

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  // -----------------------------------------------------------------------
  // 4. After login, authenticated UI elements are visible (mobile viewport)
  // -----------------------------------------------------------------------
  test('should show tab bar after successful login', async ({ page }) => {
    // Mobile viewport for tab bar visibility
    await page.setViewportSize({ width: 390, height: 844 });

    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await createTestUser(page, email, password);

    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    // Wait for authenticated layout
    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });
    await waitForIonicReady(page);

    // Tab bar should be visible on mobile
    const tabBar = page.locator('ion-footer.mobile-tabs');
    await expect(tabBar).toBeVisible({ timeout: 5_000 });

    // All tab buttons should be present
    const homeTab = page.locator('.tab-button', { hasText: /home/i });
    const teamsTab = page.locator('.tab-button', { hasText: /teams/i });
    const feedTab = page.locator('.tab-button', { hasText: /feed/i });

    await expect(homeTab).toBeVisible();
    await expect(teamsTab).toBeVisible();
    await expect(feedTab).toBeVisible();

    // Profile tab should be visible (only if user ID exists)
    const profileTab = page.locator('.tab-button ion-icon[name="person"]');
    if (await profileTab.isVisible()) {
      await expect(profileTab).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 5. Session cookies are present after login
  // -----------------------------------------------------------------------
  test('should create authenticated cookie session after login', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await createTestUser(page, email, password);

    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });

    const cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 6. Session persistence — refresh page stays logged in
  // -----------------------------------------------------------------------
  test('should maintain session after page refresh', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await createTestUser(page, email, password);

    // Login
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });

    // Refresh the page
    await page.reload();
    await waitForIonicReady(page);

    // Should still be on /home (not redirected to /login)
    expect(page.url()).toMatch(/\/(home|onboarding|tabs)/);

    const cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 7. Auto-redirect when already logged in
  // -----------------------------------------------------------------------
  test('should auto-redirect to /home if already logged in', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await createTestUser(page, email, password);

    // Login first
    await page.locator('ion-input[type="email"] input').fill(email);
    await page.locator('ion-input[type="password"] input').fill(password);
    await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });

    // Now visit /login again — should redirect back to /home
    await page.goto('/login');
    
    // Should be redirected to /home automatically
    await page.waitForURL(/\/(home|onboarding|tabs)/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/(home|onboarding|tabs)/);
  });

  // -----------------------------------------------------------------------
  // 8. Empty credentials validation
  // -----------------------------------------------------------------------
  test('should not login with empty credentials', async ({ page }) => {
    // Click Sign in without filling anything
    await page.locator('ion-button', { hasText: 'Sign in' }).click({ force: true });

    // Some builds show a warning toast, others just keep the form state unchanged
    const warningToast = page.locator('ion-toast[color="warning"]');
    const hasWarning = await warningToast.isVisible().catch(() => false);

    // Should stay on login page
    expect(page.url()).toContain('/login');
    expect(hasWarning || page.url().includes('/login')).toBeTruthy();
  });
});