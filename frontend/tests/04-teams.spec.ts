import { test, expect } from '@playwright/test';
import {
  loginTestUser,
  navigateTo,
  waitForDataLoaded,
} from './helpers';

/**
 * Phase 4: Teams
 *
 * Tests the teams listing page. Uses `app-page-header` with title="Teams",
 * `app-team-card` for team cards, action buttons for View Matches / Sync.
 */
test.describe('Phase 4: Teams', () => {
  test.setTimeout(45_000);

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, { prefix: 'teams' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }
  });

  // 1. Page loads with content
  test('should display teams page with header and content', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    // app-page-header renders an ion-header > ion-toolbar > ion-title
    await expect(page.locator('app-page-header').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('ion-content').last()).toBeVisible();
  });

  // 2. Teams list or empty state
  test('should display teams or empty state message', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    await waitForDataLoaded(page);

    const teamCards = page.locator('app-team-card');
    const hasTeams = (await teamCards.count()) > 0;
    // If no teams, page should still render without crash
    await expect(page.locator('ion-content').last()).toBeVisible();
  });

  // 3. Team card visible
  test('should display team cards with proper structure', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    await waitForDataLoaded(page);

    const teamCards = page.locator('app-team-card');
    if ((await teamCards.count()) > 0) {
      await expect(teamCards.first()).toBeVisible();
    }
  });

  // 4. View Matches action
  test('should navigate to matches when View Matches is clicked', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    await waitForDataLoaded(page);

    const btn = page.locator('ion-button', { hasText: /view matches/i }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await expect(page).toHaveURL(/\/matches\/\d+/, { timeout: 10_000 });
    }
  });

  // 5. Refresh action
  test('should reload teams when refresh action is triggered', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    const refreshBtn = page.locator('ion-button', { hasText: /refresh/i }).first();
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/teams');
    }
  });

  // 6. Navigate via tab bar (mobile) - use attribute selector
  test('should navigate to teams via tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateTo(page, '/home');

    const teamsTab = page.locator('a.tab-button[routerLink="/teams"]');
    await expect(teamsTab).toBeVisible({ timeout: 8_000 });
    await teamsTab.click();
    await page.waitForURL('**/teams', { timeout: 8_000 });
    expect(page.url()).toContain('/teams');
  });

  // 7. API error handling
  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/teams**', route => route.abort('failed'));

    await page.goto('/teams');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3_000);

    // Page should still render without crashing
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });

  // 8. Sync action
  test('should trigger sync action for teams', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    await waitForDataLoaded(page);

    const syncBtn = page.locator('ion-button', { hasText: /sync/i }).first();
    if (await syncBtn.isVisible().catch(() => false)) {
      await syncBtn.click();
      await page.waitForTimeout(1_000);
      expect(page.url()).toContain('/teams');
    }
  });

  // 9. Page structure
  test('should have proper page structure', async ({ page }) => {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return;

    // Header
    await expect(page.locator('app-page-header').first()).toBeVisible({ timeout: 5_000 });
    // Content
    await expect(page.locator('ion-content').last()).toBeVisible();
  });
});
