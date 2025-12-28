// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Mixtape E2E tests
 *
 * Tests both frontend (Next.js on 127.0.0.1:3010) and backend (Django on 127.0.0.1:8010)
 * Integrates with CI/CD deployment workflow
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially to avoid race conditions
  forbidOnly: !!process.env.CI, // Fail CI if test.only is left in code
  retries: process.env.CI ? 2 : 0, // Retry on CI, not locally
  workers: process.env.CI ? 1 : 1, // Single worker to avoid conflicts

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }], // HTML report for local debugging
    ['list'], // Console output
    ...(process.env.CI ? [['github', {}] as const] : []), // GitHub Actions annotations
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3010',

    // Collect trace on first retry for debugging
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Timeout for actions (click, fill, etc)
    actionTimeout: 10 * 1000,

    // Timeout for navigation
    navigationTimeout: 30 * 1000,
  },

  // Global setup/teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),

  // Projects - browser configurations
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment for multi-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Development server configuration
  // Note: We run Django and Next.js servers externally
  // See scripts/run-test-servers.sh for server startup
  webServer: process.env.CI ? undefined : {
    command: 'yarn dev',
    url: 'http://localhost:3010',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
