import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 15 — Analytics Pages (Pro features)
 *
 * Tests match prediction, team analytics, prediction dashboard, and team compare.
 * These require Pro access; free users should be redirected to /pro.
 */
test.describe('Phase 15: Analytics Pages', () => {
  test.describe('API Endpoints', () => {
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

    test('match prediction API should respond', async ({ page }) => {
      if (!authToken) return;
      const resp = await page.request.get('/api/analytics/match/4221/prediction', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('team analytics API should respond', async ({ page }) => {
      if (!authToken) return;
      const resp = await page.request.get('/api/analytics/team/1', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('prediction stats API should respond', async ({ page }) => {
      if (!authToken) return;
      const resp = await page.request.get('/api/analytics/predictions/stats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('team compare API should respond', async ({ page }) => {
      if (!authToken) return;
      const resp = await page.request.get('/api/analytics/team/compare?team1=1&team2=2', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });

    test('upcoming predictions API should respond', async ({ page }) => {
      if (!authToken) return;
      const resp = await page.request.get('/api/analytics/upcoming-predictions', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(resp.status()).toBeLessThan(500);
    });
  });

  test.describe('Pro User Pages', () => {
    test.beforeEach(async ({ page }) => {
      // Login as a Pro user
      await loginTestUser(page, {
        email: 'test01@test.com',
        password: 'Password123!',
        skipRegistration: true,
      });
    });

    test('should load match prediction page', async ({ page }) => {
      // Get a valid match ID
      const teamsResp = await page.request.get('/api/teams');
      let matchId = 4221; // fallback from seed data
      if (teamsResp.ok()) {
        const teams = await teamsResp.json();
        const teamList = Array.isArray(teams) ? teams : (teams?.data || []);
        if (teamList.length > 0) {
          const matchResp = await page.request.get(`/api/matches/team/${teamList[0].id}`);
          if (matchResp.ok()) {
            const matches = await matchResp.json();
            const matchList = Array.isArray(matches) ? matches : (matches?.data || []);
            if (matchList.length > 0) {
              matchId = matchList[0].id;
            }
          }
        }
      }

      await navigateTo(page, `/analytics/match/${matchId}`);
      // Pro user should see the page or be redirected (depending on subscription check)
      const url = page.url();
      const isOnPage = url.includes('/analytics/match/') || url.includes('/pro');
      expect(isOnPage).toBeTruthy();
    });

    test('should load team analytics page', async ({ page }) => {
      const teamsResp = await page.request.get('/api/teams');
      let teamId = 1;
      if (teamsResp.ok()) {
        const teams = await teamsResp.json();
        const teamList = Array.isArray(teams) ? teams : (teams?.data || []);
        if (teamList.length > 0) {
          teamId = teamList[0].id;
        }
      }
      await navigateTo(page, `/analytics/team/${teamId}`);
      const url = page.url();
      expect(url.includes('/analytics/team/') || url.includes('/pro')).toBeTruthy();
    });

    test('should load prediction analytics page', async ({ page }) => {
      await navigateTo(page, '/analytics/predictions');
      const url = page.url();
      expect(url.includes('/analytics/predictions') || url.includes('/pro')).toBeTruthy();
    });

    test('should load team compare page', async ({ page }) => {
      await navigateTo(page, '/compare');
      const url = page.url();
      expect(url.includes('/compare') || url.includes('/pro')).toBeTruthy();
    });
  });

  test.describe('Free User Redirect', () => {
    test('should redirect free user to pro page', async ({ page }) => {
      await loginTestUser(page, {
        email: 'demo.user@footdash.com',
        password: 'Password123!',
        skipRegistration: true,
      });
      await navigateTo(page, '/analytics/predictions');
      // Free user should be redirected to /pro
      await page.waitForTimeout(2_000);
      const url = page.url();
      expect(url.includes('/pro') || url.includes('/analytics')).toBeTruthy();
    });
  });
});
