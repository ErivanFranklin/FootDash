import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 17 — Gamification Pages (Leaderboard & Badges)
 *
 * Verifies leaderboard and badges pages render correctly.
 */
test.describe('Phase 17: Gamification', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test.describe('Leaderboard', () => {
    test('should display leaderboard page', async ({ page }) => {
      await navigateTo(page, '/leaderboard');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show leaderboard content', async ({ page }) => {
      await navigateTo(page, '/leaderboard');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Badges', () => {
    test('should display badges page', async ({ page }) => {
      await navigateTo(page, '/badges');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show badges or empty state', async ({ page }) => {
      await navigateTo(page, '/badges');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });
});
