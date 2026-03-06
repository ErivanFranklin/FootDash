import { test, expect, type BrowserContext } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e-new-tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
}

/**
 * Register+Login via API and inject the refresh cookie so that new pages
 * within the same browser context can restore the session. This avoids
 * UI timing issues that are irrelevant to the test's purpose.
 */
async function setupAuthViaCookie(context: BrowserContext, email: string, password: string): Promise<void> {
  // Register (409 = already exists, that's fine)
  const regResp = await context.request.post('/api/auth/register', {
    data: { email, password },
  });
  if (!regResp.ok() && regResp.status() !== 409) {
    throw new Error(`Register failed: ${regResp.status()} ${await regResp.text()}`);
  }

  // Login to get the Set-Cookie header
  const loginResp = await context.request.post('/api/auth/login', {
    data: { email, password },
  });
  if (!loginResp.ok()) {
    throw new Error(`Login failed: ${loginResp.status()} ${await loginResp.text()}`);
  }
  // Playwright's context.request automatically stores Set-Cookie from the response,
  // but page navigations in the same context need explicit cookie propagation.
  // Verify the cookie is present.
  const cookies = await context.cookies();
  const hasRefresh = cookies.some(c => c.name === 'refresh_token');
  if (!hasRefresh) {
    throw new Error('refresh_token cookie not set after login');
  }
}

test.describe('Auth restore on new tab deep links', () => {
  test.setTimeout(90_000);

  test('should keep session when opening protected routes in a new tab', async ({ context }) => {
    const email = uniqueEmail();
    const password = 'TestPassword123!';

    await setupAuthViaCookie(context, email, password);

    const protectedRoutes = ['/leaderboard', '/user-profile/1', '/match-discussion/1'];

    for (const route of protectedRoutes) {
      const tab = await context.newPage();
      await tab.goto(route);
      await tab.waitForLoadState('domcontentloaded');

      // Allow auth guard + session restore to settle.
      await tab.waitForTimeout(3000);

      const currentUrl = tab.url();
      expect(currentUrl).not.toContain('/login');
      expect(currentUrl).toContain(route);

      await tab.close();
    }
  });
});
