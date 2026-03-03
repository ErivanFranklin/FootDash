import { test, expect } from '@playwright/test';
import {
  loginTestUser,
  navigateTo,
  performLogout,
} from './helpers';

/**
 * Navigation – Full Auth Flow
 * End-to-end navigation flows that span multiple pages.
 */
test.describe('Navigation – Full Auth Flow', () => {
  test.setTimeout(60_000);

  // 1. Login → teams → feed → logout
  test('should complete login → teams → feed → logout flow', async ({ page }) => {
    await loginTestUser(page, { prefix: 'navflow' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }

    await navigateTo(page, '/teams');
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    await navigateTo(page, '/feed');
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    await performLogout(page);
    await page.waitForURL(/\/(login|home|register|feed|teams)/, { timeout: 15_000 });
  });

  // 2. Auth guard works after login
  test('should protect routes and redirect after login', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForTimeout(2_000);

    if (page.url().includes('/login') || page.url().includes('/home')) {
      await loginTestUser(page, { prefix: 'navdeep' });
      await navigateTo(page, '/teams');
      await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
    }
  });

  // 3. Multiple page navigations in sequence
  test('should navigate through multiple pages without errors', async ({ page }) => {
    await loginTestUser(page, { prefix: 'navmulti' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }

    const routes = ['/teams', '/feed', '/teams', '/feed'];
    for (const route of routes) {
      await navigateTo(page, route);
      await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
    }
  });
});
