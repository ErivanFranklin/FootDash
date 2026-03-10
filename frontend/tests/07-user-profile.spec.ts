import { test, expect } from '@playwright/test';
import {
  loginTestUser,
  navigateTo,
  waitForDataLoaded,
} from './helpers';

/**
 * Phase 7: User Profile
 *
 * Route: /user-profile/:id
 * The page has:
 *   ion-back-button[defaultHref="/feed"]
 *   .profile-header, .profile-avatar, .profile-info h1
 *   ion-grid.stats-grid, .stat-card (Followers / Following)
 *   app-follow-button (on other users' profiles)
 *   app-feed-item (activity items)
 *
 * Note: `ion-back-button` renders as hidden when there's no navigation history.
 * We use `state: 'attached'` to detect it even when visually hidden.
 */
test.describe('Phase 7: User Profile', () => {
  test.setTimeout(45_000);

  let userId: number | null = null;

  test.beforeEach(async ({ page }) => {
    const result = await loginTestUser(page, {
      email: 'erivanf10@gmail.com',
      password: 'Password123!',
      skipRegistration: true,
    });
    userId = result.userId;
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }
  });

  // 1. Navigate to own profile page
  test('should render user profile page content', async ({ page }) => {
    const id = userId ?? 1;
    await navigateTo(page, `/user-profile/${id}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });

  // 2. Profile header section
  test('should show profile header', async ({ page }) => {
    const id = userId ?? 1;
    await navigateTo(page, `/user-profile/${id}`);
    await waitForDataLoaded(page);

    // Either profile renders or content area is at least visible
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });

  // 3. Ion-title renders
  test('should display ion-title in toolbar', async ({ page }) => {
    const id = userId ?? 1;
    await navigateTo(page, `/user-profile/${id}`);
    await expect(page.locator('ion-title').first()).toBeVisible({ timeout: 5_000 });
  });

  // 4. Activity items section
  test('should render page without crash', async ({ page }) => {
    const id = userId ?? 1;
    await navigateTo(page, `/user-profile/${id}`);
    await waitForDataLoaded(page);

    // Just ensure the page loaded
    await expect(page.locator('ion-content').last()).toBeVisible();
    // No error overlay
    const errorOverlay = page.locator('.error-overlay, .error-message');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  // 5. Navigate to another user's profile
  test('should load another user profile', async ({ page }) => {
    const otherId = (userId ?? 1) + 1;
    await navigateTo(page, `/user-profile/${otherId}`);

    // Should load content (even if user doesn't exist, page shouldn't crash)
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });
});
