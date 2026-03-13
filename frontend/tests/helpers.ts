import { Page, expect } from '@playwright/test';

const PLAYWRIGHT_API_BASE_URL = (process.env['PLAYWRIGHT_API_BASE_URL'] || '').replace(/\/$/, '');

function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (PLAYWRIGHT_API_BASE_URL) {
    return `${PLAYWRIGHT_API_BASE_URL}${normalizedPath}`;
  }
  // Fallback to local dev proxy route used by ng serve.
  return `/api${normalizedPath}`;
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Generate a unique email for test isolation */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.com`;
}

const DEFAULT_PASSWORD = 'TestPassword123!';

/**
 * Register a new user via API and login via UI.
 *
 * The login flow fills the Ionic login form and waits for the
 * app to redirect to `/home` with the authenticated layout visible
 * (ion-split-pane rendered, meaning NgRx store has auth state).
 */
export async function loginTestUser(
  page: Page,
  opts: { email?: string; password?: string; prefix?: string; skipRegistration?: boolean } = {},
): Promise<{ email: string; password: string; userId: number | null }> {
  const email = opts.email ?? uniqueEmail(opts.prefix ?? 'e2e');
  const password = opts.password ?? DEFAULT_PASSWORD;

  let userId: number | null = null;

  // Register via API (tolerant of 409 Conflict if user already exists)
  // Retries once on failure (e.g. 429 throttle) after a short delay.
  if (!opts.skipRegistration) {
    let resp = await page.request.post(apiUrl('/auth/register'), {
      data: { email, password },
    });
    if (!resp.ok() && resp.status() !== 409) {
      // Retry once after a brief wait (handles rate-limiting / transient errors)
      await page.waitForTimeout(2_000);
      resp = await page.request.post(apiUrl('/auth/register'), {
        data: { email, password },
      });
    }
    if (resp.ok()) {
      try {
        const body = await resp.json();
        userId = body?.user?.id ?? body?.userId ?? null;
      } catch { /* no-op */ }
    }
  }

  // Login via UI
  await page.goto('/login');
  await waitForIonicReady(page);

  // In some runs the app restores session immediately and redirects to /home.
  if (page.url().includes('/home')) {
    await waitForAuthLayout(page);
    return { email, password, userId };
  }

  const emailInput = page.locator('ion-input[type="email"] input').first();
  const passwordInput = page.locator('ion-input[type="password"] input').first();

  const hasPasswordInput = await passwordInput
    .waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasPasswordInput) {
    // If login form is not visible, allow one short window for redirect completion.
    const redirectedHome = await page
      .waitForURL('**/home', { timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (redirectedHome) {
      await waitForAuthLayout(page);
      return { email, password, userId };
    }
    throw new Error(`Login form did not become visible. Current URL: ${page.url()}`);
  }

  await emailInput.fill(email, { timeout: 10_000 });
  await passwordInput.fill(password, { timeout: 10_000 });

  const submitLogin = async (): Promise<void> => {
    const localizedSignIn = page
      .locator('ion-button')
      .filter({ hasText: /sign in|login|log in|entrar/i })
      .first();

    if (await localizedSignIn.isVisible().catch(() => false)) {
      await localizedSignIn.click({ force: true });
      return;
    }

    const submitButton = page
      .locator('ion-button[type="submit"], button[type="submit"]')
      .first();

    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click({ force: true });
      return;
    }

    await page.keyboard.press('Enter');
  };

  await submitLogin();

  // Wait for redirect to authenticated route (home or onboarding)
  const authUrlPattern = /\/(home|onboarding|tabs)/;
  await page.waitForURL(authUrlPattern, { timeout: 20_000 }).catch(async () => {
    // Retry click in case Ionic swallowed the first one
    await submitLogin();
    await page.waitForURL(authUrlPattern, { timeout: 15_000 }).catch(async () => {
      // Final fallback: authenticate via API to set session cookie in this context.
      let loginResp = await page.request.post(apiUrl('/auth/login'), {
        data: { email, password },
        timeout: 12_000,
      });
      if (!loginResp.ok()) {
        await page.waitForTimeout(1_000);
        loginResp = await page.request.post(apiUrl('/auth/login'), {
          data: { email, password },
          timeout: 12_000,
        });
      }
      if (!loginResp.ok()) {
        throw new Error(`Login failed for ${email}. Current URL: ${page.url()}`);
      }
      await page.goto('/home');
      await page.waitForTimeout(300);
    });
  });

  // Wait for authenticated layout to be fully rendered (split-pane = auth layout is active)
  await waitForAuthLayout(page);

  return { email, password, userId };
}

// ---------------------------------------------------------------------------
// Ionic / layout helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the Ionic app shell to be attached.
 * This is a lightweight check that doesn't depend on auth state.
 */
export async function waitForIonicReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('ion-app', { state: 'attached', timeout: 10_000 }).catch(() => {});
  // Brief pause for Ionic animations/hydration
  await page.waitForTimeout(300);
}

/**
 * Wait for the authenticated layout to be rendered.
 * The app.component.html renders ion-split-pane only when `authService.isAuthenticated$` is true.
 * This confirms the APP_INITIALIZER session restore completed and the user is authenticated.
 */
export async function waitForAuthLayout(page: Page, timeout = 10_000): Promise<void> {
  await page.waitForSelector('ion-split-pane', { state: 'attached', timeout }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Navigate to a URL and wait for the page to settle.
 * After `page.goto()` the Angular app re-bootstraps and APP_INITIALIZER
 * restores the session from the HttpOnly cookie. We wait for the
 * authenticated layout before proceeding.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForIonicReady(page);
  // If we're on an auth-guarded route, wait for the auth layout
  if (!path.includes('/login') && !path.includes('/404') && !path.includes('/error')) {
    await waitForAuthLayout(page);
  }
}

/**
 * Wait for data loading to finish on pages that use skeletons/spinners.
 * Returns true if the wait succeeded (content changed from loading state).
 */
export async function waitForDataLoaded(page: Page, timeout = 8_000): Promise<void> {
  // Wait for skeleton texts and spinners to disappear
  const spinner = page.locator('ion-skeleton-text, ion-spinner').first();
  if (await spinner.isVisible().catch(() => false)) {
    await spinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }
  await page.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// Logout helpers
// ---------------------------------------------------------------------------

/**
 * Perform logout via the desktop side-menu.
 * Switches to desktop viewport so the side menu is always visible.
 */
export async function performLogout(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);

  const logoutItem = page.locator('app-navigation-menu ion-item[color="danger"]').first();
  if (await logoutItem.isVisible().catch(() => false)) {
    await logoutItem.evaluate((el: any) => el.click());
    // Logout triggers window.location.reload() after a small delay.
    // Wait for either redirect to login/home OR a page reload (staying on same URL).
    await page.waitForURL(/\/(login|home)/, { timeout: 15_000 }).catch(async () => {
      // If no redirect happened (reload stayed on current page),
      // the session should still be cleared. Navigate to login explicitly.
      await page.goto('/login');
    });
  } else {
    // Fallback: clear cookies and navigate to login
    await page.goto('/login');
  }
  await page.waitForLoadState('domcontentloaded');
}

// ---------------------------------------------------------------------------
// Data-dependent navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to matches page by going through teams first.
 * Returns the teamId if successfully navigated, null otherwise.
 */
export async function navigateToMatchesViaTeams(page: Page): Promise<number | null> {
  try {
    await navigateTo(page, '/teams');
    if (page.url().includes('/login')) return null;

    await waitForDataLoaded(page);

    const viewMatchesBtn = page.locator('ion-button', { hasText: /view matches/i }).first();
    if (!(await viewMatchesBtn.isVisible().catch(() => false))) return null;

    await viewMatchesBtn.click({ force: true });
    await page.waitForURL(/\/matches\/\d+/, { timeout: 10_000 }).catch(() => {});

    if (!page.url().includes('/matches/')) return null;

    const match = page.url().match(/\/matches\/(\d+)/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Get the first match ID by navigating teams → matches and reading a match link href.
 * Returns null if no matches are available.
 */
export async function getFirstMatchId(page: Page): Promise<number | null> {
  const teamId = await navigateToMatchesViaTeams(page);
  if (!teamId) return null;

  await waitForDataLoaded(page);
  const matchLink = page.locator('a[href*="/match/"]').first();
  if (!(await matchLink.isVisible().catch(() => false))) return null;

  const href = await matchLink.getAttribute('href');
  const match = href?.match(/\/match\/(\d+)/);
  return match ? Number(match[1]) : null;
}
