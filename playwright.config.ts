import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/formda/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },
  projects: [
    { name: 'Pixel 7', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'iPhone 14', use: { ...devices['iPhone 14'], browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://127.0.0.1:4173/formda/',
    reuseExistingServer: !process.env.CI,
  },
});
