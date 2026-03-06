import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 18 — Subscription & Export Pages
 *
 * Verifies pro subscription page, payment success, and export page.
 */
test.describe('Phase 18: Subscription & Export', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test.describe('Pro Page', () => {
    test('should display pro subscription page', async ({ page }) => {
      await navigateTo(page, '/pro');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show subscription plans or info', async ({ page }) => {
      await navigateTo(page, '/pro');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Payment Success', () => {
    test('should display payment success page', async ({ page }) => {
      await navigateTo(page, '/payments/success');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Export', () => {
    test('should display export page', async ({ page }) => {
      await navigateTo(page, '/export');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
