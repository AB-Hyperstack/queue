import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env.local so Supabase keys are available to test helpers
config({ path: resolve(__dirname, '.env.local') });

const isProduction = process.env.TEST_ENV === 'production';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'local',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'production',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://queue-olive.vercel.app',
      },
    },
  ],

  /* Start local dev server when running local tests */
  ...(isProduction
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
