import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 20 — Search, Notifications, Onboarding, Error Pages
 *
 * Verifies remaining pages that haven't been covered.
 */
test.describe('Phase 20: Remaining Pages', () => {
  test.describe('Search', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('should display search page', async ({ page }) => {
      await navigateTo(page, '/search');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show search input or content', async ({ page }) => {
      await navigateTo(page, '/search');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Notifications', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('should display notifications page', async ({ page }) => {
      await navigateTo(page, '/notifications');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Onboarding', () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page);
    });

    test('should display onboarding page', async ({ page }) => {
      await navigateTo(page, '/onboarding');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Error Pages', () => {
    test('should display 404 page', async ({ page }) => {
      await page.goto('/404');
      await waitForIonicReady(page);
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should redirect unknown routes to 404', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');
      await waitForIonicReady(page);
      await page.waitForTimeout(2_000);
      expect(page.url()).toContain('/404');
    });

    test('should display error page', async ({ page }) => {
      await page.goto('/error');
      await waitForIonicReady(page);
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
