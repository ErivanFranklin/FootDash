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
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible({ timeout: 5000 });

  // Try to register first (if register page exists). If not, attempt login.
  const email = uniqueEmail();
  const password = 'Password123!';

  // Fill login form and submit; if backend requires prior registration, the login may fail.
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // If login fails, stay on page; try to register if route exists
  // Navigate to /home which is guarded; if redirected back to /login, the login failed
  await page.waitForTimeout(1000);
  await page.goto('/home');

  const atHome = await page.getByRole('heading', { name: /home/i }).isVisible().catch(() => false);
  if (!atHome) {
    // Try to hit register endpoint directly to create the user, then login again
    // Use fetch from the browser context to call /api/auth/register
    const resp = await page.request.post('/api/auth/register', {
      data: { email, password },
    });
    expect(resp.ok()).toBeTruthy();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/home');
  }

  // Navigate to Teams and expect header
  await page.goto('/teams');
  await expect(page.getByRole('heading', { name: /teams/i })).toBeVisible({ timeout: 5000 });

  // Optional: if there are zero teams, the empty state should appear
  const empty = page.getByText(/no teams found/i);
  await expect(empty).toBeVisible({ timeout: 5000 });
});
