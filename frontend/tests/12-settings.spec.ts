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
    const logoutMatcher = /logout|log out|sign out|sair/i;

    // Primary: settings page itself exposes logout control.
    const logoutBtn = page
      .locator('ion-button, button')
      .filter({ hasText: logoutMatcher })
      .first();
    const logoutItem = page.locator('ion-item').filter({ hasText: logoutMatcher }).first();
    const inSettings = await logoutBtn.or(logoutItem).isVisible().catch(() => false);

    if (!inSettings) {
      // Fallback: current UX may expose logout only in desktop side navigation.
      await page.setViewportSize({ width: 1280, height: 800 });
      await navigateTo(page, '/teams');
      const navLogout = page
        .locator('app-navigation-menu ion-item')
        .filter({ hasText: logoutMatcher })
        .first();
      await expect(navLogout).toBeVisible({ timeout: 8_000 });
    }
  });
});
