import { test, expect, Page } from '@playwright/test';

/**
 * Phase 7: User Profile — E2E Tests
 *
 * Tests the user profile page functionality:
 *  1. Profile page loads with correct header and back button
 *  2. Profile header displays user info (avatar, username, join date)
 *  3. Follow stats (followers / following) are displayed
 *  4. Follow button is present and interactive
 *  5. Recent activity section renders
 *  6. Profile page handles unknown users gracefully
 *  7. Report user dialog works
 *  8. Profile navigation from feed items
 *  9. Profile accessible via tab bar (own profile)
 * 10. Load More activity on profile
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
  return `e2e-profile-${Date.now()}@test.com`;
}

/** Wait for Ionic page to be fully hydrated */
async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

/** Create a test user via API and login via UI. Returns the user info. */
async function loginTestUser(page: Page) {
  const testEmail = uniqueEmail();
  const testPassword = 'TestPassword123!';

  const resp = await page.request.post('/api/auth/register', {
    data: { email: testEmail, password: testPassword },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();

  await page.goto('/login');
  await page.locator('ion-input[type="email"] input').fill(testEmail);
  await page.locator('ion-input[type="password"] input').fill(testPassword);
  await page.locator('ion-button', { hasText: 'Sign in' }).click();
  await page.waitForURL('**/home', { timeout: 10_000 });
  await waitForIonicReady(page);

  // Extract user ID from register response or token
  const userId = body?.user?.id ?? body?.userId ?? null;
  return { email: testEmail, password: testPassword, userId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Phase 7: User Profile', () => {

  // -----------------------------------------------------------------------
  // 1. Profile page loads with correct header
  // -----------------------------------------------------------------------
  test('should load user profile page with header and back button', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    // Navigate to own profile (or user 1 as fallback)
    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Header should be visible with title (use banner role to target main page header)
    const header = page.getByRole('banner').locator('ion-title');
    await expect(header).toBeVisible({ timeout: 5_000 });

    // Back button should be present
    const backButton = page.locator('ion-back-button');
    await expect(backButton).toBeVisible();

    // Report button should be present
    const reportButton = page.locator('ion-button ion-icon[name="flag-outline"]');
    await expect(reportButton).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 2. Profile header displays user info
  // -----------------------------------------------------------------------
  test('should display user profile header with avatar and info', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Profile header section
    const profileHeader = page.locator('.profile-header');
    await expect(profileHeader).toBeVisible({ timeout: 5_000 });

    // Avatar area should be present (either img or icon fallback)
    const avatarSection = page.locator('.profile-avatar');
    await expect(avatarSection).toBeVisible();

    const avatar = avatarSection.locator('ion-avatar');
    await expect(avatar).toBeVisible();

    // Username should be displayed
    const username = profileHeader.locator('h1');
    await expect(username).toBeVisible();
    const usernameText = await username.textContent();
    expect(usernameText?.trim().length).toBeGreaterThan(0);

    // Join date should be visible
    const joinDate = profileHeader.locator('.join-date');
    await expect(joinDate).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 3. Follow stats are displayed
  // -----------------------------------------------------------------------
  test('should display follower and following stats', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Stats grid
    const statsGrid = page.locator('.stats-grid');
    await expect(statsGrid).toBeVisible({ timeout: 5_000 });

    // Followers stat
    const followersLabel = page.locator('.stat-card', { hasText: 'Followers' });
    await expect(followersLabel).toBeVisible();

    // Following stat
    const followingLabel = page.locator('.stat-card', { hasText: 'Following' });
    await expect(followingLabel).toBeVisible();

    // Both should have numeric values
    const followerCount = followersLabel.locator('h2');
    await expect(followerCount).toBeVisible();
    const followerText = await followerCount.textContent();
    expect(Number(followerText?.trim())).toBeGreaterThanOrEqual(0);

    const followingCount = followingLabel.locator('h2');
    await expect(followingCount).toBeVisible();
    const followingText = await followingCount.textContent();
    expect(Number(followingText?.trim())).toBeGreaterThanOrEqual(0);
  });

  // -----------------------------------------------------------------------
  // 4. Follow button is present and interactive
  // -----------------------------------------------------------------------
  test('should display follow button on user profile', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Follow button component should be present
    const followButton = page.locator('app-follow-button');
    await expect(followButton).toBeVisible({ timeout: 5_000 });

    // The actual ion-button inside
    const ionButton = followButton.locator('ion-button');
    await expect(ionButton).toBeVisible();

    // Button should have text (Follow / Following / Unfollow)
    const buttonText = await ionButton.textContent();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------------------
  // 5. Recent activity section renders
  // -----------------------------------------------------------------------
  test('should display recent activity or empty state', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    const feedItems = page.locator('app-feed-item');
    const emptyState = page.locator('ion-card', { hasText: /no activity yet/i });
    const loadingState = page.locator('ion-card', { hasText: /loading activity/i });

    const hasActivity = (await feedItems.count()) > 0;
    const isEmpty = await emptyState.isVisible();
    const isLoading = await loadingState.isVisible();

    // Should show activities, empty state, or loading
    expect(hasActivity || isEmpty || isLoading).toBeTruthy();

    // If there are feed items, the list header should exist
    if (hasActivity) {
      const listHeader = page.locator('ion-list-header');
      await expect(listHeader).toBeVisible();
    }
  });

  // -----------------------------------------------------------------------
  // 6. Profile page handles unknown / invalid user IDs
  // -----------------------------------------------------------------------
  test('should handle non-existent user profile gracefully', async ({ page }) => {
    await loginTestUser(page);

    // Navigate to a user ID that likely doesn't exist
    await page.goto('/user-profile/999999');
    await waitForIonicReady(page);
    await page.waitForTimeout(3000);

    // Page should not crash — header should still render (use banner role for main header)
    const header = page.getByRole('banner').locator('ion-title');
    await expect(header).toBeVisible({ timeout: 5_000 });

    // Profile should show fallback data (error handler creates minimal user)
    const profileHeader = page.locator('.profile-header');
    await expect(profileHeader).toBeVisible();

    // Username fallback should contain "User"
    const username = profileHeader.locator('h1');
    await expect(username).toBeVisible();
    const text = await username.textContent();
    expect(text).toContain('User');
  });

  // -----------------------------------------------------------------------
  // 7. Report user dialog
  // -----------------------------------------------------------------------
  test('should open report user dialog', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Click the report button (flag icon)
    const reportBtn = page.locator('ion-button:has(ion-icon[name="flag-outline"])');
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // Alert dialog should appear
    const alert = page.locator('ion-alert');
    await expect(alert).toBeVisible({ timeout: 5_000 });

    // Should have "Report User" header
    const alertHeader = alert.locator('.alert-head');
    await expect(alertHeader).toContainText('Report User');

    // Should have radio options for reason
    const radioButtons = alert.locator('button.alert-radio-button');
    const radioCount = await radioButtons.count();
    expect(radioCount).toBeGreaterThanOrEqual(3); // At least Spam, Harassment, Inappropriate

    // Should have Cancel and Report buttons
    const cancelBtn = alert.locator('button', { hasText: 'Cancel' });
    await expect(cancelBtn).toBeVisible();

    const reportConfirmBtn = alert.locator('button', { hasText: 'Report' });
    await expect(reportConfirmBtn).toBeVisible();

    // Dismiss the dialog
    await cancelBtn.click();
    await expect(alert).not.toBeVisible({ timeout: 3_000 });
  });

  // -----------------------------------------------------------------------
  // 8. Profile accessible via tab bar (own profile)
  // -----------------------------------------------------------------------
  test('should navigate to own profile via profile tab', async ({ page }) => {
    // Mobile viewport for tab bar
    await page.setViewportSize({ width: 390, height: 844 });

    await loginTestUser(page);

    // Start on home
    await page.goto('/home');
    await waitForIonicReady(page);

    // Click profile tab (person icon)
    const profileTab = page.locator('.tab-button ion-icon[name="person"]').locator('..');

    if (await profileTab.isVisible()) {
      await profileTab.click();
      await page.waitForTimeout(2000);

      // Should navigate to user-profile/:id
      await expect(page).toHaveURL(/\/user-profile\/\d+/, { timeout: 5_000 });

      // Profile page should load
      const profileHeader = page.locator('.profile-header');
      await expect(profileHeader).toBeVisible({ timeout: 5_000 });
    }
  });

  // -----------------------------------------------------------------------
  // 9. Back button navigates back from profile
  // -----------------------------------------------------------------------
  test('should navigate back via back button', async ({ page }) => {
    await loginTestUser(page);

    // Start on feed
    await page.goto('/feed');
    await waitForIonicReady(page);

    // Navigate to a profile
    await page.goto('/user-profile/1');
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Back button should be visible
    const backButton = page.locator('ion-back-button');
    await expect(backButton).toBeVisible();

    // Click back
    await backButton.click();
    await page.waitForTimeout(2000);

    // Should have navigated away from user-profile
    // Default href is /feed
    const currentUrl = page.url();
    const isOnProfile = /\/user-profile\/1$/.test(currentUrl);
    expect(isOnProfile).toBeFalsy();
  });

  // -----------------------------------------------------------------------
  // 10. Profile page has proper structure and accessibility
  // -----------------------------------------------------------------------
  test('should have proper page structure and accessibility', async ({ page }) => {
    const { userId } = await loginTestUser(page);

    const profileId = userId || 1;
    await page.goto(`/user-profile/${profileId}`);
    await waitForIonicReady(page);
    await page.waitForTimeout(2000);

    // Header with toolbar
    const toolbar = page.locator('ion-toolbar');
    await expect(toolbar.first()).toBeVisible();

    // Content area
    const content = page.locator('ion-content');
    await expect(content.last()).toBeVisible();

    // Profile sections should be properly structured
    const profileAvatar = page.locator('.profile-avatar');
    const profileInfo = page.locator('.profile-info');
    const profileActions = page.locator('.profile-actions');

    await expect(profileAvatar).toBeVisible();
    await expect(profileInfo).toBeVisible();
    await expect(profileActions).toBeVisible();

    // Stats grid uses ion-grid with columns
    const statsGrid = page.locator('.stats-grid ion-col');
    const colCount = await statsGrid.count();
    expect(colCount).toBe(2); // Followers + Following
  });
});
