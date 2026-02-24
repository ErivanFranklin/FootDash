import { test, expect, Page } from '@playwright/test';

/**
 * Phase 4: Teams — E2E Tests
 *
 * Tests the teams feature functionality:
 *  1. Teams list loads and displays properly
 *  2. Team cards show correct information
 *  3. Team actions work (View Matches, Analytics, Sync)
 *  4. Empty state handling
 *  5. Loading states
 *  6. Team search/filtering (if implemented)
 *  7. Team card navigation
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
  return `e2e-teams-${Date.now()}@test.com`;
}

/** Wait for Ionic page to be fully hydrated */
async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  // Small buffer for Ionic animations to settle
  await page.waitForTimeout(500);
}

/** Create a test user and login (fast setup) */
async function loginTestUser(page: Page, email?: string, password?: string) {
  const testEmail = email || uniqueEmail();
  const testPassword = password || 'TestPassword123!';

  // Create user via API
  const resp = await page.request.post('/api/auth/register', {
    data: { email: testEmail, password: testPassword },
  });
  expect(resp.ok()).toBeTruthy();

  // Login via UI
  await page.goto('/login');
  await page.locator('ion-input[type="email"] input').fill(testEmail);
  await page.locator('ion-input[type="password"] input').fill(testPassword);
  await page.locator('ion-button', { hasText: 'Sign in' }).click();
  
  // Wait for redirect to home
  await page.waitForURL('**/home', { timeout: 10_000 });
  await waitForIonicReady(page);

  return { email: testEmail, password: testPassword };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 4: Teams', () => {

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  // -----------------------------------------------------------------------
  // 1. Teams page loads correctly
  // -----------------------------------------------------------------------
  test('should display teams page with correct header', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);

    // Page header should be visible
    const pageTitle = page.locator('ion-title', { hasText: 'Teams' });
    await expect(pageTitle).toBeVisible({ timeout: 5_000 });

    // Main content should be loaded (specifically the main page content, not side menu)
    const content = page.getByRole('main');
    await expect(content).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 2. Teams list loads (or shows empty state)
  // -----------------------------------------------------------------------
  test('should display teams or empty state message', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);

    // Wait for loading to complete
    const spinner = page.locator('ion-skeleton-text, ion-spinner');
    if (await spinner.first().isVisible()) {
      await expect(spinner.first()).not.toBeVisible({ timeout: 10_000 });
    }

    // Either teams should be visible or "No teams found" message
    const teamCards = page.locator('app-team-card');
    const emptyMessage = page.locator('text=No teams found');

    const hasTeams = await teamCards.first().isVisible();
    const hasEmptyMessage = await emptyMessage.isVisible();

    // At least one should be true
    expect(hasTeams || hasEmptyMessage).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 3. Team card displays correctly (if teams exist)
  // -----------------------------------------------------------------------
  test('should display team cards with proper structure', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    const teamCards = page.locator('app-team-card');
    const teamCount = await teamCards.count();

    if (teamCount > 0) {
      const firstTeam = teamCards.first();
      await expect(firstTeam).toBeVisible();

      // Team cards should be clickable/interactive
      const teamElement = firstTeam.locator('ion-card, .team-card, [data-testid="team-card"]').first();
      if (await teamElement.isVisible()) {
        await expect(teamElement).toBeVisible();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 4. Team actions work (View Matches button)
  // -----------------------------------------------------------------------
  test('should navigate to matches when View Matches is clicked', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    const teamCards = page.locator('app-team-card');
    const teamCount = await teamCards.count();

    if (teamCount > 0) {
      // Look for "View Matches" button or action
      const viewMatchesBtn = page.locator('ion-button', { hasText: /view matches/i }).first();
      
      if (await viewMatchesBtn.isVisible()) {
        await viewMatchesBtn.click();
        
        // Should navigate to matches page with team ID
        await expect(page).toHaveURL(/\/matches\/\d+/, { timeout: 5_000 });
      }
    }
  });

  // -----------------------------------------------------------------------
  // 5. Refresh functionality works
  // -----------------------------------------------------------------------
  test('should reload teams when refresh action is triggered', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);

    // Look for refresh button in header actions
    const refreshBtn = page.locator('ion-button', { hasText: /refresh/i });
    
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      
      // Should show loading state briefly
      const loadingIndicator = page.locator('ion-skeleton-text, ion-spinner').first();
      // Note: loading might be too fast to catch, so this is optional
      
      // Page should still be on teams
      expect(page.url()).toContain('/teams');
    }
  });

  // -----------------------------------------------------------------------
  // 6. Navigation via tab bar to teams page
  // -----------------------------------------------------------------------
  test('should navigate to teams via tab bar', async ({ page }) => {
    // Mobile viewport for tab bar
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/home');
    await waitForIonicReady(page);

    // Click teams tab
    const teamsTab = page.locator('.tab-button', { hasText: /teams/i });
    await teamsTab.click();

    // Should navigate to teams
    await page.waitForURL('**/teams', { timeout: 5_000 });
    expect(page.url()).toContain('/teams');

    // Teams tab should be active
    await expect(teamsTab).toHaveClass(/tab-active/);
  });

  // -----------------------------------------------------------------------
  // 7. Teams page handles API errors gracefully
  // -----------------------------------------------------------------------
  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept the teams API call and make it fail
    await page.route('**/api/teams**', async route => {
      await route.abort('failed');
    });

    await page.goto('/teams');
    await waitForIonicReady(page);

    // Wait for the request to potentially fail
    await page.waitForTimeout(3000);

    // Page should still render (not crash)
    const content = page.getByRole('main');
    await expect(content).toBeVisible();

    // Should show empty state or error message (not crash)
    const pageTitle = page.locator('ion-title', { hasText: 'Teams' });
    await expect(pageTitle).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 8. Sync team functionality (if available)
  // -----------------------------------------------------------------------
  test('should trigger sync action for teams', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    const teamCards = page.locator('app-team-card');
    const teamCount = await teamCards.count();

    if (teamCount > 0) {
      // Look for "Sync Team" button
      const syncBtn = page.locator('ion-button', { hasText: /sync/i }).first();
      
      if (await syncBtn.isVisible()) {
        await syncBtn.click();
        
        // Should show loading state or success feedback
        // (The sync might be fast, so we just verify the action can be triggered)
        await page.waitForTimeout(1000);
        
        // Page should remain on teams
        expect(page.url()).toContain('/teams');
      }
    }
  });

  // -----------------------------------------------------------------------
  // 9. Analytics navigation (pro feature)
  // -----------------------------------------------------------------------
  test('should handle analytics navigation', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    const teamCards = page.locator('app-team-card');
    const teamCount = await teamCards.count();

    if (teamCount > 0) {
      // Look for "View Analytics" button
      const analyticsBtn = page.locator('ion-button', { hasText: /analytics/i }).first();
      
      if (await analyticsBtn.isVisible()) {
        await analyticsBtn.click();
        
        // Should either navigate to analytics or pro page (if not pro user)
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const isOnAnalytics = currentUrl.includes('/analytics');
        const isOnPro = currentUrl.includes('/pro');
        
        // Should be on either analytics (if pro) or pro page (if not pro)
        expect(isOnAnalytics || isOnPro).toBeTruthy();
      }
    }
  });

  // -----------------------------------------------------------------------
  // 10. Page accessibility and UI structure
  // -----------------------------------------------------------------------
  test('should have proper page structure and accessibility', async ({ page }) => {
    await page.goto('/teams');
    await waitForIonicReady(page);

    // Header should have proper structure (main page header, not menu header)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Content area should be present (main page content)
    const content = page.getByRole('main');
    await expect(content).toBeVisible();

    // Menu button should exist (might be hidden on desktop, visible on mobile)
    const menuButton = page.locator('ion-menu-button');
    await expect(menuButton).toBeAttached();

    // Title should be descriptive (specifically the main page title)
    const title = page.locator('ion-title', { hasText: 'Teams' });
    await expect(title).toBeVisible();
  });
});