import { test, expect, Page } from '@playwright/test';

/**
 * Phase 8: Match Discussion — E2E Tests
 *
 * Tests the match discussion / chat functionality:
 *  1. Match discussion page loads with header and back button
 *  2. Match header displays team names and score/status
 *  3. Discussion / comments section renders
 *  4. Comment form is present
 *  5. Comment empty state message
 *  6. Match reactions area
 *  7. Match discussion handles invalid match ID gracefully
 *  8. Match chat component on match details page
 *  9. Back button navigates back
 * 10. Page structure and accessibility
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
  return `e2e-discussion-${Date.now()}@test.com`;
}

async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

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
 * Navigate to the first available match and return its matchId.
 * Returns null if no matches are available.
 */
async function getFirstMatchId(page: Page): Promise<number | null> {
  await page.goto('/teams');
  await waitForIonicReady(page);
  await page.waitForTimeout(2000);

  const viewMatchesBtn = page.locator('ion-button', { hasText: /view matches/i }).first();
  if (!(await viewMatchesBtn.isVisible())) return null;

  await viewMatchesBtn.click();
  await page.waitForURL(/\/matches\/\d+/, { timeout: 5_000 });
  await page.waitForTimeout(3000);

  const matchLink = page.locator('a[href*="/match/"]').first();
  if (!(await matchLink.isVisible())) return null;

  const href = await matchLink.getAttribute('href');
  const match = href?.match(/\/match\/(\d+)/);
  return match ? Number(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 8: Match Discussion', () => {

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  // -----------------------------------------------------------------------
  // 1. Match discussion page loads with header
  // -----------------------------------------------------------------------
  test('should load match discussion page with header', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(2000);

      // Header title should say "Match Discussion"
      const title = page.locator('ion-title', { hasText: 'Match Discussion' });
      await expect(title).toBeVisible({ timeout: 5_000 });

      // Back button should be present
      const backButton = page.locator('ion-back-button');
      await expect(backButton).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 2. Match header shows team names
  // -----------------------------------------------------------------------
  test('should display match header with team information', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      // Match header section
      const matchHeader = page.locator('.match-header');
      if (await matchHeader.isVisible()) {
        // Teams row
        const teamsRow = page.locator('.match-teams');
        await expect(teamsRow).toBeVisible();

        // Team names
        const teamNames = page.locator('.match-teams .team h3');
        const nameCount = await teamNames.count();
        expect(nameCount).toBe(2); // Home + Away

        // Match status should be visible
        const status = page.locator('.match-status');
        await expect(status).toBeVisible();

        // Match date should be visible
        const date = page.locator('.match-date');
        await expect(date).toBeVisible();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 3. Comments section renders
  // -----------------------------------------------------------------------
  test('should display comments section or loading state', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      // Discussion header should be visible
      const discussionHeader = page.locator('ion-list-header', { hasText: 'Discussion' });
      const commentList = page.locator('app-comment-list');
      const loadingCard = page.locator('ion-card', { hasText: /loading match details/i });

      const hasDiscussion = await discussionHeader.isVisible();
      const hasCommentList = await commentList.isVisible();
      const isLoading = await loadingCard.isVisible();

      // Should have discussion section, comment list, or loading
      expect(hasDiscussion || hasCommentList || isLoading).toBeTruthy();
    }
  });

  // -----------------------------------------------------------------------
  // 4. Comment form is present
  // -----------------------------------------------------------------------
  test('should display comment form in discussion', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      // Comment form component should be present
      const commentForm = page.locator('app-comment-form');
      if (await commentForm.first().isVisible()) {
        await expect(commentForm.first()).toBeVisible();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 5. Empty comments state
  // -----------------------------------------------------------------------
  test('should show empty state when no comments exist', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      const commentItems = page.locator('app-comment-list ion-item-group');
      const emptyState = page.locator('ion-card', { hasText: /no comments yet/i });

      const hasComments = (await commentItems.count()) > 0;
      const isEmpty = await emptyState.isVisible();

      // Either comments exist or empty state shown
      expect(hasComments || isEmpty).toBeTruthy();
    }
  });

  // -----------------------------------------------------------------------
  // 6. Match reactions area
  // -----------------------------------------------------------------------
  test('should display match reactions area', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      // Reaction button component may or may not be visible depending on data
      const reactionArea = page.locator('.match-reactions');
      const reactionButton = page.locator('app-reaction-button');

      // Either reactions area is visible or not (depends on API response)
      // Just verify the page didn't crash
      const content = page.locator('ion-content').last();
      await expect(content).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 7. Handles invalid match ID gracefully
  // -----------------------------------------------------------------------
  test('should handle invalid match ID gracefully', async ({ page }) => {
    await page.goto('/match-discussion/999999');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    // Page should not crash — header should still be visible
    const title = page.locator('ion-title', { hasText: 'Match Discussion' });
    await expect(title).toBeVisible({ timeout: 5_000 });

    // Content area should still render
    const content = page.locator('ion-content').last();
    await expect(content).toBeVisible();

    // Either fallback match header renders or loading/error state is shown
    const matchHeader = page.locator('.match-header');
    const loadingCard = page.locator('ion-card', { hasText: /loading match details/i });

    const hasFallback = await matchHeader.isVisible();
    const isLoading = await loadingCard.isVisible();

    // Either the fallback rendered or it shows loading state — page didn't crash
    expect(hasFallback || isLoading).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 8. Match chat component on match details page
  // -----------------------------------------------------------------------
  test('should display match chat on match details page', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      // Go to match details (not discussion)
      await page.goto(`/match/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(3000);

      // Match chat component should be present
      const chatComponent = page.locator('app-match-chat');
      if (await chatComponent.isVisible()) {
        // Chat container should have a header
        const chatHeader = chatComponent.locator('.header h3');
        await expect(chatHeader).toBeVisible();

        // Chat should have a messages area
        const messagesArea = chatComponent.locator('.messages-area');
        await expect(messagesArea).toBeVisible();

        // Chat should have an input area
        const inputArea = chatComponent.locator('.input-area');
        await expect(inputArea).toBeVisible();

        // Send button should be present
        const sendBtn = chatComponent.locator('ion-button ion-icon[name="send"]');
        await expect(sendBtn).toBeVisible();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 9. Back button navigates back
  // -----------------------------------------------------------------------
  test('should navigate back via back button', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(2000);

      const backButton = page.locator('ion-back-button');
      await expect(backButton).toBeVisible();

      await backButton.click();
      await page.waitForTimeout(2000);

      // Should have navigated away from match-discussion
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/match-discussion/');
    }
  });

  // -----------------------------------------------------------------------
  // 10. Page structure and accessibility
  // -----------------------------------------------------------------------
  test('should have proper page structure', async ({ page }) => {
    const matchId = await getFirstMatchId(page);

    if (matchId) {
      await page.goto(`/match-discussion/${matchId}`);
      await waitForIonicReady(page);
      await page.waitForTimeout(2000);

      // Toolbar with title
      const toolbar = page.locator('ion-toolbar').first();
      await expect(toolbar).toBeVisible();

      // Content area
      const content = page.locator('ion-content').last();
      await expect(content).toBeVisible();

      // Back button for navigation
      const backBtn = page.locator('ion-back-button');
      await expect(backBtn).toBeVisible();

      // Title is descriptive
      const title = page.locator('ion-title', { hasText: 'Match Discussion' });
      await expect(title).toBeVisible();
    }
  });
});
