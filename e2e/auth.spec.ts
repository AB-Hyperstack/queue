/**
 * Suite 5: Authentication Flow Tests
 * Tests login, signup, and auth redirects
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page renders the form correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByText(/sign in to queueflow/i)).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login page shows QueueFlow branding', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByText('QueueFlow', { exact: true }).first()).toBeVisible();
  });

  test('can toggle to signup mode', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByText(/don't have an account/i).click();

    await expect(page.getByText(/create your account/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });

  test('can toggle back from signup to login', async ({ page }) => {
    await page.goto('/auth/login');

    // Go to signup
    await page.getByText(/don't have an account/i).click();
    await expect(page.getByText(/create your account/i)).toBeVisible();

    // Go back to login
    await page.getByText(/already have an account/i).click();
    await expect(page.getByText(/sign in to queueflow/i)).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByPlaceholder('you@company.com').fill('nonexistent@test.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error
    await expect(page.getByText(/invalid|error|incorrect|failed/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('unauthenticated access to /dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('unauthenticated access to /settings redirects to login', async ({ page }) => {
    await page.goto('/settings');

    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('unauthenticated access to /analytics redirects to login', async ({ page }) => {
    await page.goto('/analytics');

    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('redirect parameter is preserved on login redirect', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('redirect=');
  });
});
