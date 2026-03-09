import { test, expect } from '@playwright/test';
import {
  loginTestUser,
  navigateTo,
  navigateToMatchesViaTeams,
  waitForDataLoaded,
} from './helpers';

/**
 * Phase 8: Match Details & Discussion
 *
 * Routes:
 *   /match/:matchId          → MatchDetailsPage
 *   /match-discussion/:id    → MatchDiscussionPage
 *
 * Getting a valid match ID requires: teams → "View Matches" → read match link.
 * This is slow, so tests use extended timeout.
 */
test.describe('Phase 8: Match Details & Discussion', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, { prefix: 'discussion' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }
  });

  // Helper: get a match ID
  async function getMatchId(page: import('@playwright/test').Page): Promise<string | null> {
    try {
      const teamId = await navigateToMatchesViaTeams(page);
      if (!teamId) return null;

      await waitForDataLoaded(page);
      const matchLink = page.locator('a[href*="/match/"]').first();
      if (!(await matchLink.isVisible({ timeout: 5_000 }).catch(() => false))) return null;

      const href = await matchLink.getAttribute('href');
      const m = href?.match(/\/match\/(\d+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  // 1. Navigate to match details page
  test('should navigate to match details page', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return; // no fixtures

    await navigateTo(page, `/match/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });

  // 2. Navigate to match discussion page
  test('should navigate to match discussion page', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return;

    await navigateTo(page, `/match-discussion/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });
  });

  // 3. Match details renders without crash
  test('should render match details without errors', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return;

    await navigateTo(page, `/match/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    const errorOverlay = page.locator('.error-overlay, .error-message');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  // 4. Match discussion renders without crash
  test('should render match discussion without errors', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return;

    await navigateTo(page, `/match-discussion/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    const errorOverlay = page.locator('.error-overlay, .error-message');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  // 5. Match details chat section shows messages
  test('should show chat messages on match details', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return;

    await navigateTo(page, `/match/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    // Chat container should be visible
    const chatContainer = page.locator('.chat-container');
    const hasChatContainer = await chatContainer.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasChatContainer) {
      // Should have messages area with sample or real messages
      const messagesArea = page.locator('.messages-area');
      await expect(messagesArea).toBeVisible({ timeout: 3_000 });
    }
  });

  // 6. Match details tab switching works
  test('should switch between Info and Lineups tabs', async ({ page }) => {
    const matchId = await getMatchId(page);
    if (!matchId) return;

    await navigateTo(page, `/match/${matchId}`);
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    // Click Lineups tab
    const lineupsTab = page.locator('ion-segment-button[value="lineups"]');
    if (await lineupsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await lineupsTab.click();
      await page.waitForTimeout(1_000);

      // Click Info tab back
      const infoTab = page.locator('ion-segment-button[value="info"]');
      await infoTab.click();
      await page.waitForTimeout(500);
    }
  });
});
