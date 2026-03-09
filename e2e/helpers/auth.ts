/**
 * Auth helpers for E2E tests
 * Provides login utilities for authenticated test scenarios
 */
import { type Page } from '@playwright/test';

/**
 * Login via the UI login form
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 10_000,
  });
}
