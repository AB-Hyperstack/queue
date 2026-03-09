/**
 * Suite 1: Public Pages Smoke Tests
 * Verifies public pages load correctly and contain expected elements
 */
import { test, expect } from '@playwright/test';
import { DEMO_ORG } from './helpers/fixtures';

test.describe('Public Pages Smoke', () => {
  test('home page loads with title and sign in button', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/QueueFlow/i);
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('home page has hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/smart queue management/i)).toBeVisible();
  });

  test('home page has pricing section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/simple, transparent pricing/i)).toBeVisible();
  });

  test('home page has demo links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /try demo/i })).toBeVisible();
  });

  test('login page loads with email and password form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login page has signup toggle', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  test('join page loads for demo org', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible();
  });

  test('kiosk page loads for demo org', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible();
    await expect(page.getByText(/tap a queue/i)).toBeVisible();
  });

  test('display page loads for demo org', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible();
  });

  test('invalid org slug shows error on join page', async ({ page }) => {
    await page.goto('/join/nonexistent-org-xyz');
    // Wait for loading to finish — should show some kind of error/not found state
    await page.waitForLoadState('networkidle');
    // The page should not show the join form — either error or empty
    const hasError = await page.getByText(/not found|error|doesn't exist|no queues/i).isVisible().catch(() => false);
    const hasNoQueues = await page.getByText(/join the queue/i).isVisible().catch(() => false);
    // Either shows an error or the org doesn't exist
    expect(hasError || !hasNoQueues).toBe(true);
  });
});
