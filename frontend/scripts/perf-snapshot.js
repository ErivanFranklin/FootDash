const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: 'http://localhost:4200' });

  const login = await page.request.post('/api/auth/login', {
    data: { email: 'erivanf10@gmail.com', password: 'Password123!' },
  });

  if (!login.ok()) {
    throw new Error(`Login failed: ${login.status()}`);
  }

  await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const perf = page.getByText('Performance', { exact: true });
  if (await perf.count()) {
    await perf.click();
  }

  await page.waitForTimeout(2500);
  await page.screenshot({
    path: 'test-results/performance-tab-snapshot.png',
    fullPage: true,
  });

  await browser.close();
  console.log('Saved screenshot to test-results/performance-tab-snapshot.png');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
