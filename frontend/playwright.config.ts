import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  /* Uncomment to auto-start the dev server before tests:
  webServer: {
    command: 'npm start',
    cwd: __dirname,
    port: 4200,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
