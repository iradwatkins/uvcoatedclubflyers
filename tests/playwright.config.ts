import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for UV Coated Club Flyers E2E testing
 */
export default defineConfig({
  testDir: './playwright',

  // Run tests in parallel
  fullyParallel: false,

  // Retry on CI, no retry locally
  retries: 0,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: '../test-results/playwright-report' }],
    ['json', { outputFile: '../test-results/test-results.json' }],
    ['list']
  ],

  // Shared test timeout
  timeout: 120000, // 2 minutes per test

  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'on',

    // Video on failure
    video: 'retain-on-failure',

    // Viewport
    viewport: { width: 1920, height: 1080 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },

  // Output folder
  outputDir: '../test-results/playwright-artifacts',
});
