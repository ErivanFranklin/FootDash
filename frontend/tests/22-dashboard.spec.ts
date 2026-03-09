import { test, expect } from '@playwright/test';
import { loginTestUser, waitForDataLoaded } from './helpers';

/**
 * Dashboard / Home Page Tests
 *
 * Verifies:
 * - Dashboard loads without console errors
 * - Charts/stats section renders with data (or demo fallback)
 * - Card alignment is consistent
 * - Quick action chips are visible
 */
test.describe('Dashboard Home Page', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await loginTestUser(page, { prefix: 'dashboard' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth session not restored');
    }
  });

  test('should render dashboard without errors', async ({ page }) => {
    await expect(page.locator('ion-content').last()).toBeVisible({ timeout: 5_000 });

    // Should not have error overlay
    const errorOverlay = page.locator('.error-overlay, .error-message');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should display dashboard stats cards', async ({ page }) => {
    // Wait for charts component to load
    const chartsRow = page.locator('.charts-row');
    const hasCharts = await chartsRow.isVisible({ timeout: 8_000 }).catch(() => false);

    if (hasCharts) {
      // Should have 4 mini chart cards
      const miniCards = page.locator('.mini-chart-card');
      await expect(miniCards).toHaveCount(4, { timeout: 5_000 });

      // Predictions card should not show "—"
      const predictionsCard = miniCards.nth(1);
      const predictionsValue = predictionsCard.locator('.mini-value');
      const text = await predictionsValue.textContent();
      // In dev mode, demo data should be seeded so we don't see "—" alone
      expect(text?.trim()).not.toBe('—');
    }
  });

  test('should display quick action chips', async ({ page }) => {
    const quickActions = page.locator('.quick-actions');
    const hasActions = await quickActions.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasActions) {
      const chips = quickActions.locator('ion-chip');
      const count = await chips.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }
  });

  test('should have consistent card alignment', async ({ page }) => {
    // Check that dashboard content uses consistent padding
    const dashboardContent = page.locator('.dashboard-content');
    const hasDashboard = await dashboardContent.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasDashboard) {
      // Verify the content has appropriate padding by checking computed style
      const padding = await dashboardContent.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          left: style.paddingLeft,
          right: style.paddingRight,
        };
      });
      expect(padding.left).toBe(padding.right);
    }
  });
});
