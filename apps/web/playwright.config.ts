import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Primary: Desktop Chrome — smoke + regression
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile: iPhone SE (375px) — cross-browser / device tests
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Firefox desktop
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit (Safari desktop)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile Safari — iPhone 13
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    // iPad Air — landscape
    {
      name: 'tablet',
      use: {
        ...devices['iPad Air'],
        viewport: { width: 1024, height: 768 },
      },
    },
  ],
});
