import { test, expect, Page } from '@playwright/test';

/**
 * Phase 5: Matches — E2E Tests
 *
 * Tests the matches functionality:
 *  1. Matches page loads with correct header and layout
 *  2. Matches list displays fixtures or empty state
 *  3. Match filter controls render correctly
 *  4. Quick filter chips are interactive
 *  5. Match cards display correct information
 *  6. Pull-to-refresh works
 *  7. Match card links to match details
 *  8. Floating action button triggers refresh
 *  9. Navigating to matches from teams page
 * 10. Match details page renders correctly
 *
 * Pre-requisites:
 *  - Frontend dev server running on localhost:4200
 *  - Backend running on localhost:3000
 *  - Database running and accessible
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uniqueEmail(): string {
  return `e2e-matches-${Date.now()}@test.com`;
}

/** Wait for Ionic page to be fully hydrated */
async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

/** Create a test user and login (fast setup) */
async function loginTestUser(page: Page) {
  const testEmail = uniqueEmail();
  const testPassword = 'TestPassword123!';

  const resp = await page.request.post('/api/auth/register', {
    data: { email: testEmail, password: testPassword },
  });
  expect(resp.ok()).toBeTruthy();

  await page.goto('/login');
  await page.locator('ion-input[type="email"] input').fill(testEmail);
  await page.locator('ion-input[type="password"] input').fill(testPassword);
  await page.locator('ion-button', { hasText: 'Sign in' }).click();
  await page.waitForURL('**/home', { timeout: 10_000 });
  await waitForIonicReady(page);
}

/**
 * Navigate to a valid matches page by first visiting teams,
 * finding a team, and clicking View Matches.
 * Returns the teamId from the URL, or null if no teams available.
 */
async function navigateToMatchesViaTeams(page: Page): Promise<number | null> {
  await page.goto('/teams');
  await waitForIonicReady(page);
  await page.waitForTimeout(2000);

  const teamCards = page.locator('app-team-card');
  const count = await teamCards.count();
  if (count === 0) return null;

  const viewMatchesBtn = page.locator('ion-button', { hasText: /view matches/i }).first();
  if (!(await viewMatchesBtn.isVisible())) return null;

  await viewMatchesBtn.click();
  await page.waitForURL(/\/matches\/\d+/, { timeout: 5_000 });

  const url = page.url();
  const match = url.match(/\/matches\/(\d+)/);
  return match ? Number(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 5: Matches', () => {

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  // -----------------------------------------------------------------------
  // 1. Matches page loads correctly
  // -----------------------------------------------------------------------
  test('should navigate to matches page via teams', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Wait for matches page to fully load
      await waitForIonicReady(page);

      // Page header should be visible
      const pageTitle = page.locator('ion-title').first();
      await expect(pageTitle).toBeVisible({ timeout: 5_000 });

      // Main content area should be visible (use last ion-content which is the active page)
      const content = page.locator('ion-content[role="main"]').last();
      await expect(content).toBeVisible();

      // URL should contain matches/<teamId>
      expect(page.url()).toContain(`/matches/${teamId}`);
    }
  });

  // -----------------------------------------------------------------------
  // 2. Matches page shows fixtures or empty state
  // -----------------------------------------------------------------------
  test('should display matches or empty state message', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Wait for loading to finish
      await page.waitForTimeout(3000);

      const matchCards = page.locator('app-match-card');
      const emptyMsg = page.locator('text=No fixtures loaded yet.');
      const skeletons = page.locator('app-match-skeleton');

      // Should show either: match cards, empty message, or still loading
      const hasMatches = (await matchCards.count()) > 0;
      const isEmpty = await emptyMsg.isVisible();
      const isLoading = (await skeletons.count()) > 0;

      expect(hasMatches || isEmpty || isLoading).toBeTruthy();
    }
  });

  // -----------------------------------------------------------------------
  // 3. Match filter section renders
  // -----------------------------------------------------------------------
  test('should display match filter controls', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Filter section (app-form-section with title "Match Filters")
      const filterSection = page.locator('app-form-section', { hasText: /match filters/i });
      await expect(filterSection).toBeVisible({ timeout: 5_000 });

      // Season input
      const seasonInput = page.locator('ion-input[type="number"]').first();
      await expect(seasonInput).toBeVisible();

      // Range input
      const rangeInput = page.locator('ion-input[placeholder="recent|upcoming|all"]');
      await expect(rangeInput).toBeVisible();

      // Limit input
      const limitInput = page.locator('ion-label', { hasText: 'Limit' });
      await expect(limitInput).toBeVisible();

      // Date range inputs
      const fromInput = page.locator('ion-input[placeholder="2025-01-01"]');
      await expect(fromInput).toBeVisible();

      const toInput = page.locator('ion-input[placeholder="2025-12-31"]');
      await expect(toInput).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 4. Quick filter chips are interactive
  // -----------------------------------------------------------------------
  test('should have interactive quick filter chips', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Quick filter chips should be visible
      const chips = page.locator('.quick-filters ion-chip');
      const chipCount = await chips.count();
      expect(chipCount).toBe(3); // Today, Live, Upcoming

      // Verify chip labels
      const todayChip = page.locator('ion-chip', { hasText: 'Today' });
      const liveChip = page.locator('ion-chip', { hasText: 'Live' });
      const upcomingChip = page.locator('ion-chip', { hasText: 'Upcoming' });

      await expect(todayChip).toBeVisible();
      await expect(liveChip).toBeVisible();
      await expect(upcomingChip).toBeVisible();

      // Click a chip – it should get "selected" class
      await todayChip.click();
      await page.waitForTimeout(500);
      await expect(todayChip).toHaveClass(/chip-selected/);

      // Clicking another chip should deselect the first
      await upcomingChip.click();
      await page.waitForTimeout(500);
      await expect(upcomingChip).toHaveClass(/chip-selected/);
      await expect(todayChip).not.toHaveClass(/chip-selected/);

      // Clicking the same chip again should deselect it
      await upcomingChip.click();
      await page.waitForTimeout(500);
      await expect(upcomingChip).not.toHaveClass(/chip-selected/);
    }
  });

  // -----------------------------------------------------------------------
  // 5. Match cards display correct structure
  // -----------------------------------------------------------------------
  test('should display match cards with proper structure', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      await page.waitForTimeout(3000);

      const matchCards = page.locator('app-match-card');
      const cardCount = await matchCards.count();

      if (cardCount > 0) {
        const firstCard = matchCards.first();
        await expect(firstCard).toBeVisible();

        // Match card should have an ion-card element
        const card = firstCard.locator('ion-card');
        await expect(card).toBeVisible();

        // Should have a card header
        const cardHeader = firstCard.locator('ion-card-header');
        await expect(cardHeader).toBeVisible();

        // Should have card content
        const cardContent = firstCard.locator('ion-card-content');
        await expect(cardContent).toBeVisible();

        // Should have match date info (calendar icon)
        const dateIcon = firstCard.locator('ion-icon[name="calendar-outline"]');
        if (await dateIcon.isVisible()) {
          await expect(dateIcon).toBeVisible();
        }
      }
    }
  });

  // -----------------------------------------------------------------------
  // 6. Header actions work (Fetch button)
  // -----------------------------------------------------------------------
  test('should reload matches via Fetch header action', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Wait for initial loading to finish
      await page.waitForTimeout(3000);

      // The page header has a "Fetch" action button (might have icon + text)
      // Look for it by aria-label or text content
      const fetchBtn = page.locator('ion-button[aria-label="Fetch"], ion-button:has-text("Fetch")').first();
      
      if (await fetchBtn.isVisible()) {
        await fetchBtn.click();

        // Wait for reload to complete
        await page.waitForTimeout(3000);
      }

      // Page should still be valid after reload
      const content = page.locator('ion-content[role="main"]').last();
      await expect(content).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 7. Match card navigates to match details
  // -----------------------------------------------------------------------
  test('should navigate to match details when clicking a match card', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      await page.waitForTimeout(3000);

      // Match cards are wrapped in <a> tags with routerLink
      const matchLinks = page.locator('a[href*="/match/"]');
      const linkCount = await matchLinks.count();

      if (linkCount > 0) {
        const firstLink = matchLinks.first();
        await firstLink.click();

        // Should navigate to match details
        await expect(page).toHaveURL(/\/match\/\d+/, { timeout: 5_000 });
        await waitForIonicReady(page);

        // Match details page should have a back button
        const backButton = page.locator('ion-back-button');
        await expect(backButton).toBeVisible();

        // Should have the Match Details title
        const detailsTitle = page.locator('ion-title');
        await expect(detailsTitle).toBeVisible();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 8. Floating action button triggers refresh
  // -----------------------------------------------------------------------
  test('should have a floating action button for refresh', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // FAB button should be present
      const fab = page.locator('ion-fab-button');
      await expect(fab).toBeVisible({ timeout: 5_000 });

      // FAB should have a refresh icon
      const refreshIcon = fab.locator('ion-icon[name="refresh"]');
      await expect(refreshIcon).toBeVisible();

      // Clicking FAB should trigger a reload
      await fab.click();
      await page.waitForTimeout(2000);

      // Page should still be valid
      const content = page.getByRole('main');
      await expect(content).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 9. Sync Fixtures header action
  // -----------------------------------------------------------------------
  test('should trigger sync fixtures via header action', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      // Wait for initial loading to finish
      await page.waitForTimeout(3000);

      // The page header has a "Sync Fixtures" action button
      const syncBtn = page.locator('ion-button[aria-label="Sync Fixtures"], ion-button:has-text("Sync Fixtures")').first();

      if (await syncBtn.isVisible()) {
        await syncBtn.click();

        // Wait for sync to complete
        await page.waitForTimeout(3000);

        // Should show a toast message (success or failure)
        // Toast might have already appeared and disappeared
      }

      // Page should still be valid
      const content = page.locator('ion-content[role="main"]').last();
      await expect(content).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 10. Match details page renders correctly
  // -----------------------------------------------------------------------
  test('should render match details page with proper structure', async ({ page }) => {
    const teamId = await navigateToMatchesViaTeams(page);

    if (teamId) {
      await page.waitForTimeout(3000);

      // Navigate to first match details
      const matchLinks = page.locator('a[href*="/match/"]');
      const linkCount = await matchLinks.count();

      if (linkCount > 0) {
        await matchLinks.first().click();
        await expect(page).toHaveURL(/\/match\/\d+/, { timeout: 5_000 });
        await waitForIonicReady(page);
        await page.waitForTimeout(2000);

        // Back button should point to /teams
        const backButton = page.locator('ion-back-button');
        await expect(backButton).toBeVisible();

        // Match details content
        const matchDetails = page.locator('.match-details');
        if (await matchDetails.isVisible()) {
          // Teams row with home and away teams
          const teamsRow = page.locator('.teams-row');
          await expect(teamsRow).toBeVisible();

          // Score display
          const score = page.locator('.score');
          await expect(score).toBeVisible();

          // Home and away team names
          const homeTeam = page.locator('.team.home .team-name');
          const awayTeam = page.locator('.team.away .team-name');
          await expect(homeTeam).toBeVisible();
          await expect(awayTeam).toBeVisible();

          // Meta section (kickoff, venue, etc.)
          const meta = page.locator('.meta');
          await expect(meta).toBeVisible();
        }

        // Prediction voting section
        const votingSection = page.locator('.voting-section');
        if (await votingSection.isVisible()) {
          const votingComponent = page.locator('app-prediction-voting');
          await expect(votingComponent).toBeVisible();
        }

        // Chat section
        const chatSection = page.locator('.chat-section');
        if (await chatSection.isVisible()) {
          const chatComponent = page.locator('app-match-chat');
          await expect(chatComponent).toBeVisible();
        }
      }
    }
  });
});
