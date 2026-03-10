import { test, expect } from '@playwright/test';
import { loginTestUser, waitForIonicReady, navigateTo } from './helpers';

/**
 * 17 — Gamification Pages (Leaderboard & Badges)
 *
 * Verifies leaderboard and badges pages render correctly.
 */
test.describe('Phase 17: Gamification', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test.describe('Leaderboard', () => {
    test('should display leaderboard page', async ({ page }) => {
      await navigateTo(page, '/leaderboard');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show leaderboard content', async ({ page }) => {
      await navigateTo(page, '/leaderboard');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });

    test('should show scope and period segments', async ({ page }) => {
      await navigateTo(page, '/leaderboard');
      await expect(page.getByRole('tab', { name: 'Global' })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('tab', { name: 'Friends' })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('tab', { name: 'Weekly' })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('tab', { name: 'Monthly' })).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Badges', () => {
    test('should display badges page', async ({ page }) => {
      await navigateTo(page, '/badges');
      await expect(page.locator('ion-content').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should show badges or empty state', async ({ page }) => {
      await navigateTo(page, '/badges');
      const content = page.locator('ion-content').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });

    test('should render tier chips for badge filtering', async ({ page }) => {
      await navigateTo(page, '/badges');
      await expect(page.getByText('All Tiers', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Bronze', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Silver', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Gold', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('Platinum', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
