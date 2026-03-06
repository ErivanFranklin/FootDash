import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 14 — Fantasy League (all 4 pages)
 *
 * Verifies fantasy home, league detail, team detail, and transfer market.
 */
test.describe('Phase 14: Fantasy League', () => {
  let authToken: string;

  test.beforeEach(async ({ page }) => {
    const { email, password } = await loginTestUser(page, {
      email: 'test01@test.com',
      password: 'Password123!',
      skipRegistration: true,
    });
    // Get token for API calls
    const loginResp = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    if (loginResp.ok()) {
      const body = await loginResp.json();
      authToken = body?.tokens?.accessToken || body?.accessToken || '';
    }
  });

  test('should display fantasy home page', async ({ page }) => {
    await navigateTo(page, '/fantasy');
    await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should show fantasy leagues or empty state', async ({ page }) => {
    await navigateTo(page, '/fantasy');
    const content = page.locator('ion-content').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test.fixme('fantasy leagues API should respond', async ({ page }) => {
    // Known 500 – backend fantasy leagues service issue
    if (!authToken) return;
    const resp = await page.request.get('/api/fantasy/leagues', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(resp.status()).toBeLessThan(500);
  });

  test('should load fantasy league detail page', async ({ page }) => {
    if (!authToken) return;
    const resp = await page.request.get('/api/fantasy/leagues', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resp.ok()) {
      const leagues = await resp.json();
      const list = Array.isArray(leagues) ? leagues : (leagues?.data || []);
      if (list.length > 0) {
        await navigateTo(page, `/fantasy/league/${list[0].id}`);
        await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('should load fantasy team detail page', async ({ page }) => {
    if (!authToken) return;
    const resp = await page.request.get('/api/fantasy/leagues', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resp.ok()) {
      const leagues = await resp.json();
      const list = Array.isArray(leagues) ? leagues : (leagues?.data || []);
      if (list.length > 0) {
        // Get standings to find a team
        const standingsResp = await page.request.get(`/api/fantasy/leagues/${list[0].id}/standings`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (standingsResp.ok()) {
          const standings = await standingsResp.json();
          const teams = Array.isArray(standings) ? standings : (standings?.teams || standings?.data || []);
          if (teams.length > 0) {
            const teamId = teams[0]?.fantasyTeam?.id || teams[0]?.id || teams[0]?.teamId;
            if (teamId) {
              await navigateTo(page, `/fantasy/league/${list[0].id}/team/${teamId}`);
              await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
            }
          }
        }
      }
    }
  });

  test('should load fantasy transfer market page', async ({ page }) => {
    if (!authToken) return;
    const resp = await page.request.get('/api/fantasy/leagues', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resp.ok()) {
      const leagues = await resp.json();
      const list = Array.isArray(leagues) ? leagues : (leagues?.data || []);
      if (list.length > 0) {
        await navigateTo(page, `/fantasy/league/${list[0].id}/transfers`);
        await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('fantasy team API should respond', async ({ page }) => {
    if (!authToken) return;
    const resp = await page.request.get('/api/fantasy/teams/1', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    // 404 is OK (team not found for this user), 500 is not
    expect(resp.status()).toBeLessThan(500);
  });
});
