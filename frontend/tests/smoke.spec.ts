import { test, expect } from '@playwright/test';

// Utility to generate unique emails per run
function uniqueEmail() {
  const ts = Date.now();
  return `playwright-${ts}@example.com`;
}

// Minimal flow: visit login, register user, login, navigate to Teams page
// Note: Backend and DB must be running and /api proxy must work for this test to pass.
test('login → teams → matches smoke flow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Login').first()).toBeVisible({ timeout: 5000 });

  // Try to register first (if register page exists). If not, attempt login.
  const email = uniqueEmail();
  const password = 'Password123!';

  // Register a new user via API first, then login through the UI
  const resp = await page.request.post('/api/auth/register', {
    data: { email, password },
  });
  expect(resp.ok()).toBeTruthy();

  // Fill login form and submit
  await page.locator('ion-input[type="email"] input').fill(email);
  await page.locator('ion-input[type="password"] input').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // App can route first-time users to onboarding before home.
  await expect(page).toHaveURL(/.*(home|onboarding)/, { timeout: 10000 });

  // Navigate to Teams and expect header
  await page.goto('/teams');
  await expect(page.getByText('Teams').first()).toBeVisible({ timeout: 5000 });

  // Should display either teams with action buttons or empty state
  // Wait for page content to load
  await page.waitForTimeout(2000);
  const hasTeams = await page.getByText(/View Matches/i).first().isVisible().catch(() => false);
  const hasEmptyState = await page.getByText(/no teams found/i).isVisible().catch(() => false);
  expect(hasTeams || hasEmptyState).toBeTruthy();
});
