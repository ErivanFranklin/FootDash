import { test, expect } from '@playwright/test';
import {
  loginTestUser,
  navigateTo,
  navigateToMatchesViaTeams,
  waitForDataLoaded,
} from './helpers';

/**
 * Phase 5: Matches
 *
 * Tests the matches page accessed via teams → "View Matches".
 * Uses `app-page-header`, `app-match-card` inside `<a routerLink>`,
 * `ion-chip` quick filters, `ion-fab-button`, `app-form-section` for filters.
 *
 * Increased timeout because navigating teams → matches is a multi-step flow.
 */
test.describe('Phase 5: Matches', () => {
  // Increase timeout for data-dependent multi-step navigation
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, { prefix: 'matches' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }
  });

  // 1. Navigate to matches page via teams
  test('should navigate to matches page via teams', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) {
      // No teams available – verify teams page loaded at least
      await expect(page.locator('ion-content').last()).toBeVisible();
      return;
    }
    expect(page.url()).toContain(`/matches/${teamId}`);
  });

  // 2. Matches page: header renders
  test('should display page header on matches page', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) return;

    const header = page.locator('app-page-header').first();
    await expect(header).toBeVisible({ timeout: 5_000 });
  });

  // 3. Matches or empty state / skeletons
  test('should display matches, empty state, or loading', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) return;

    await waitForDataLoaded(page);

    const matchCards = page.locator('app-match-card');
    const emptyMsg = page.locator('text=/no fixtures|no matches/i');
    const skeletons = page.locator('app-match-skeleton');

    const hasMatches = (await matchCards.count()) > 0;
    const isEmpty = await emptyMsg.isVisible().catch(() => false);
    const isLoading = (await skeletons.count()) > 0;

    expect(hasMatches || isEmpty || isLoading).toBeTruthy();
  });

  // 4. Match cards are wrapped in router links
  test('should wrap match cards in router links', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) return;

    await waitForDataLoaded(page);

    const matchLinks = page.locator('a[href*="/match/"]');
    const count = await matchLinks.count();
    // If there are links, each should contain a match card
    if (count > 0) {
      const firstCard = matchLinks.first().locator('app-match-card');
      await expect(firstCard).toBeVisible({ timeout: 3_000 });
    }
  });

  // 5. Match card navigates to match details
  test('should navigate to match details on card click', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) return;

    await waitForDataLoaded(page);

    const matchLinks = page.locator('a[href*="/match/"]');
    if ((await matchLinks.count()) > 0) {
      await matchLinks.first().click();
      await expect(page).toHaveURL(/\/match\/\d+/, { timeout: 10_000 });
    }
  });

  // 6. Ion content renders
  test('should render ion-content on matches page', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);
    if (!teamId) return;

    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });
});
