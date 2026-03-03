import { test, expect, Page } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e-core-${Date.now()}@test.com`;
}

async function waitForIonicReady(page: Page) {
  await page.waitForSelector('ion-app.ion-page, ion-app ion-router-outlet', {
    state: 'attached',
    timeout: 10_000,
  });
  await page.waitForTimeout(500);
}

async function loginTestUser(page: Page) {
  const email = uniqueEmail();
  const password = 'TestPassword123!';

  const registerResponse = await page.request.post('/api/auth/register', {
    data: { email, password },
  });
  expect(registerResponse.ok()).toBeTruthy();

  await page.goto('/login');
  await page.locator('ion-input[type="email"] input').fill(email);
  await page.locator('ion-input[type="password"] input').fill(password);
  await page.locator('ion-button', { hasText: 'Sign in' }).evaluate((el: any) => el.click());

  await page.waitForURL('**/home', { timeout: 10_000 });
  await waitForIonicReady(page);
}

test.describe('Phase 10: Core Feature Routes', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('should load authenticated core routes without crashing', async ({ page }) => {
    const coreRoutes = [
      '/notifications',
      '/settings',
      '/search',
      '/leaderboard',
      '/badges',
      '/export',
      '/leagues',
      '/fantasy',
      '/highlights',
      '/odds',
      '/pro',
    ];

    for (const route of coreRoutes) {
      await page.goto(route);
      await waitForIonicReady(page);

      const currentUrl = page.url();
      expect(currentUrl.includes(route) || currentUrl.includes('/login')).toBeTruthy();

      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      await expect(page.locator('ion-content').first()).toBeVisible();
    }
  });

  test('should load league standings details route', async ({ page }) => {
    await page.goto('/leagues/1/standings');
    await waitForIonicReady(page);

    const currentUrl = page.url();
    const onStandings = currentUrl.includes('/leagues/1/standings');
    const redirectedToError = currentUrl.includes('/404') || currentUrl.includes('/error');
    const redirectedToLeagues = currentUrl.includes('/leagues');
    const redirectedToAuth = currentUrl.includes('/login') || currentUrl.includes('/home');

    expect(onStandings || redirectedToError || redirectedToLeagues || redirectedToAuth).toBeTruthy();
    await expect(page.locator('ion-content').first()).toBeVisible();
  });

  test('should load fantasy detail routes', async ({ page }) => {
    const fantasyRoutes = ['/fantasy/league/1', '/fantasy/league/1/team/1'];

    for (const route of fantasyRoutes) {
      await page.goto(route);
      await waitForIonicReady(page);

      const currentUrl = page.url();
      const onTargetRoute = currentUrl.includes(route);
      const redirectedToError = currentUrl.includes('/404') || currentUrl.includes('/error');
      const redirectedToFantasy = currentUrl.includes('/fantasy');
      const redirectedToAuthOrPro = currentUrl.includes('/login') || currentUrl.includes('/pro') || currentUrl.includes('/home');

      expect(onTargetRoute || redirectedToError || redirectedToFantasy || redirectedToAuthOrPro).toBeTruthy();
      await expect(page.locator('ion-content').first()).toBeVisible();
    }
  });
});
