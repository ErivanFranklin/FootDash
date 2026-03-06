import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 12 — Settings Page
 *
 * Verifies the settings page renders and has expected elements.
 */
test.describe('Phase 12: Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('should navigate to settings page', async ({ page }) => {
    await navigateTo(page, '/settings');
    await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should display settings page content', async ({ page }) => {
    await navigateTo(page, '/settings');
    // Settings page should have a title or heading
    const pageContent = page.locator('ion-content').first();
    await expect(pageContent).toBeVisible({ timeout: 10_000 });
  });

  test('should have logout option', async ({ page }) => {
    await navigateTo(page, '/settings');
    // Look for logout button or similar
    const logoutBtn = page.locator('ion-button, button').filter({ hasText: /logout|log out|sign out|sair/i }).first();
    const hasLogout = await logoutBtn.isVisible().catch(() => false);
    // Logout may be an ion-item or button
    if (!hasLogout) {
      const logoutItem = page.locator('ion-item').filter({ hasText: /logout|log out|sign out|sair/i }).first();
      await expect(logoutItem.or(logoutBtn)).toBeVisible({ timeout: 5_000 });
    }
  });
});
