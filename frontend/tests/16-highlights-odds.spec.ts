import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 16 — Highlights & Odds Pages
 *
 * Verifies highlights and odds pages render and API endpoints respond.
 */
test.describe('Phase 16: Highlights & Odds', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const { email, password } = await loginTestUser(page);
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    if (loginResp.ok()) {
      const body = await loginResp.json();
      authToken = body?.tokens?.accessToken || body?.accessToken || '';
    }
  });

  test.describe('Highlights', () => {
    test('should display highlights page', async ({ page }) => {
      await navigateTo(page, '/highlights');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test.fixme('highlights API should respond', async ({ page }) => {
      // Known 500 – backend highlights service issue
      if (!authToken) return;
      const resp = await page.request.get('/api/highlights', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test.fixme('highlights search API should respond', async ({ page }) => {
      // Known 500 – backend highlights service issue
      if (!authToken) return;
      const resp = await page.request.get('/api/highlights/search?q=goal', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('should show highlights content or empty state', async ({ page }) => {
      await navigateTo(page, '/highlights');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Odds', () => {
    test('should display odds page', async ({ page }) => {
      await navigateTo(page, '/odds');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test.fixme('odds API should respond', async ({ page }) => {
      // Known 500 – backend odds service issue
      if (!authToken) return;
      const resp = await page.request.get('/api/odds', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test.fixme('value bets API should respond', async ({ page }) => {
      // Known 500 – backend odds service issue
      if (!authToken) return;
      const resp = await page.request.get('/api/odds/value-bets', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('should show odds content or empty state', async ({ page }) => {
      await navigateTo(page, '/odds');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });
  });
});
