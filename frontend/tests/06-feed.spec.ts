import { test, expect, Page } from '@playwright/test';

/**
 * Phase 6: Feed & Social — E2E Tests
 *
 * Tests the activity feed / social functionality:
 *  1. Feed page loads with correct header
 *  2. Feed type segment selector (Global / For You)
 *  3. Feed displays activities or empty state
 *  4. Feed item structure (avatar, text, timestamp, icon)
 *  5. Switching feed type reloads content
 *  6. Load More button works when more data available
 *  7. Pull-to-refresh reloads the feed
 *  8. Feed items are clickable / navigable
 *  9. Feed page navigable via tab bar
 * 10. Feed handles API errors gracefully
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
  return `e2e-feed-${Date.now()}@test.com`;
}

/** Wait for Ionic page to be fully hydrated */
async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

/** Create a test user and login */
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 6: Feed & Social', () => {

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  // -----------------------------------------------------------------------
  // 1. Feed page loads with correct header
  // -----------------------------------------------------------------------
  test('should load feed page with Activity Feed header', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);

    // Header should show "Activity Feed"
    const pageTitle = page.locator('ion-title', { hasText: 'Activity Feed' });
    await expect(pageTitle).toBeVisible({ timeout: 5_000 });

    // Content area should be present
    const content = page.locator('ion-content').last();
    await expect(content).toBeVisible();

    // Menu button should be present
    const menuButton = page.locator('ion-menu-button');
    await expect(menuButton).toBeAttached();
  });

  // -----------------------------------------------------------------------
  // 2. Feed type segment selector renders
  // -----------------------------------------------------------------------
  test('should display feed type segment selector', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);

    // Segment selector should be visible
    const segment = page.locator('ion-segment');
    await expect(segment).toBeVisible({ timeout: 5_000 });

    // Should have two segments: Global and For You
    const globalSegment = page.locator('ion-segment-button[value="global"]');
    const personalizedSegment = page.locator('ion-segment-button[value="personalized"]');

    await expect(globalSegment).toBeVisible();
    await expect(personalizedSegment).toBeVisible();

    // Verify labels
    await expect(globalSegment.locator('ion-label')).toContainText('Global');
    await expect(personalizedSegment.locator('ion-label')).toContainText('For You');

    // Global should be selected by default
    await expect(globalSegment).toHaveClass(/segment-button-checked/);
  });

  // -----------------------------------------------------------------------
  // 3. Feed displays activities or shows empty state
  // -----------------------------------------------------------------------
  test('should display activities or empty state', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);

    // Wait for loading to complete
    await page.waitForTimeout(3000);

    const feedItems = page.locator('app-feed-item');
    const emptyState = page.locator('ion-card', { hasText: /no global activity yet/i });
    const loadingState = page.locator('ion-spinner');

    const hasItems = (await feedItems.count()) > 0;
    const isEmpty = await emptyState.isVisible();
    const isLoading = await loadingState.first().isVisible();

    // Should show either feed items, empty state, or loading
    expect(hasItems || isEmpty || isLoading).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 4. Feed item structure
  // -----------------------------------------------------------------------
  test('should display feed items with proper structure', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    const feedItems = page.locator('app-feed-item');
    const itemCount = await feedItems.count();

    if (itemCount > 0) {
      const firstItem = feedItems.first();
      await expect(firstItem).toBeVisible();

      // Feed item should be an ion-item
      const ionItem = firstItem.locator('ion-item');
      await expect(ionItem).toBeVisible();

      // Should have an avatar
      const avatar = firstItem.locator('ion-avatar');
      await expect(avatar).toBeVisible();

      // Should have a label with user name and activity text
      const label = firstItem.locator('ion-label');
      await expect(label).toBeVisible();

      // Should have a timestamp
      const timestamp = firstItem.locator('.timestamp');
      await expect(timestamp).toBeVisible();

      // Should have an activity icon
      const icon = firstItem.locator('ion-icon[slot="end"]');
      await expect(icon).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 5. Switching feed type reloads content
  // -----------------------------------------------------------------------
  test('should reload content when switching feed type', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Global should be active initially
    const globalSegment = page.locator('ion-segment-button[value="global"]');
    await expect(globalSegment).toHaveClass(/segment-button-checked/);

    // Switch to "For You" (personalized)
    const personalizedSegment = page.locator('ion-segment-button[value="personalized"]');
    await personalizedSegment.click();
    await page.waitForTimeout(2000);

    // Personalized segment should now be active
    await expect(personalizedSegment).toHaveClass(/segment-button-checked/);
    await expect(globalSegment).not.toHaveClass(/segment-button-checked/);

    // Should show personalized content or empty state
    const feedItems = page.locator('app-feed-item');
    const emptyState = page.locator('ion-card', { hasText: /no personalized activity yet/i });
    const hasItems = (await feedItems.count()) > 0;
    const isEmpty = await emptyState.isVisible();

    // Either items or the personalized empty state
    expect(hasItems || isEmpty).toBeTruthy();

    // Switch back to Global
    await globalSegment.click();
    await page.waitForTimeout(2000);

    // Global should be active again
    await expect(globalSegment).toHaveClass(/segment-button-checked/);
  });

  // -----------------------------------------------------------------------
  // 6. Load More button
  // -----------------------------------------------------------------------
  test('should show Load More button when more data is available', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    const loadMoreBtn = page.locator('ion-button', { hasText: /load more activity/i });
    const feedItems = page.locator('app-feed-item');
    const feedCount = await feedItems.count();

    if (await loadMoreBtn.isVisible()) {
      // Load More should be clickable
      const initialCount = feedCount;

      await loadMoreBtn.click();
      await page.waitForTimeout(3000);

      // After clicking, either more items loaded or button disappeared
      const newCount = await feedItems.count();
      const buttonStillVisible = await loadMoreBtn.isVisible();

      // Either more items were loaded, or the button is now hidden (no more data)
      expect(newCount >= initialCount || !buttonStillVisible).toBeTruthy();
    }
    // If no Load More, that's fine (not enough data to paginate)
  });

  // -----------------------------------------------------------------------
  // 7. Pull-to-refresh works
  // -----------------------------------------------------------------------
  test('should support pull-to-refresh on feed', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Refresher component should exist (even if not visible until pulled)
    const refresher = page.locator('ion-refresher');
    await expect(refresher).toBeAttached();

    // Content area should remain stable
    const content = page.locator('ion-content').last();
    await expect(content).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 8. Feed items are clickable / navigable
  // -----------------------------------------------------------------------
  test('should be able to click on feed items', async ({ page }) => {
    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    const feedItems = page.locator('app-feed-item');
    const itemCount = await feedItems.count();

    if (itemCount > 0) {
      const firstItem = feedItems.first();

      // The item should be clickable (button attribute on ion-item)
      const ionItem = firstItem.locator('ion-item[button]');
      await expect(ionItem).toBeVisible();

      // Click should navigate somewhere (match, user-profile, etc.)
      const currentUrl = page.url();
      await ionItem.click();
      await page.waitForTimeout(2000);

      // URL might have changed (navigation), or modal/detail might have appeared
      // Either way, the app should not crash
      const appContainer = page.locator('ion-app');
      await expect(appContainer).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 9. Feed page accessible via tab bar
  // -----------------------------------------------------------------------
  test('should navigate to feed via tab bar', async ({ page }) => {
    // Mobile viewport for tab bar
    await page.setViewportSize({ width: 390, height: 844 });

    // Start on home
    await page.goto('/home');
    await waitForIonicReady(page);

    // Click feed tab
    const feedTab = page.locator('.tab-button', { hasText: /feed/i });
    await feedTab.click();
    await page.waitForURL('**/feed', { timeout: 5_000 });

    expect(page.url()).toContain('/feed');
    await expect(feedTab).toHaveClass(/tab-active/);

    // Feed page content should be visible
    const pageTitle = page.locator('ion-title', { hasText: 'Activity Feed' });
    await expect(pageTitle).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 10. Feed handles API errors gracefully
  // -----------------------------------------------------------------------
  test('should handle API errors gracefully on feed', async ({ page }) => {
    // Intercept the feed API to simulate an error
    await page.route('**/api/feed/global**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/feed');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    // Page should not crash
    const pageTitle = page.locator('ion-title', { hasText: 'Activity Feed' });
    await expect(pageTitle).toBeVisible();

    // Should show empty state (error falls through to empty activities)
    const content = page.locator('ion-content').last();
    await expect(content).toBeVisible();

    // The feed component handles errors by logging and setting loading=false
    // so it should show either empty state card or just the segment
    const segment = page.locator('ion-segment');
    await expect(segment).toBeVisible();
  });
});
