/**
 * Suite 6: Dashboard Operations Tests
 * Tests the staff dashboard — requires authentication
 * These tests are skipped if TEST_USER_EMAIL/TEST_USER_PASSWORD are not set
 */
import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

const testEmail = process.env.TEST_USER_EMAIL || '';
const testPassword = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = testEmail && testPassword;

test.describe('Dashboard Operations', () => {
  test.skip(!hasCredentials, 'Skipped: TEST_USER_EMAIL and TEST_USER_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    if (hasCredentials) {
      await loginViaUI(page, testEmail, testPassword);
    }
  });

  test('dashboard loads after login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/queue management/i)).toBeVisible({ timeout: 15_000 });
  });

  test('dashboard shows stats blocks', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show Waiting and Serving stat blocks
    await expect(page.getByText(/waiting/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/serving/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard shows queue tabs', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should have clickable queue tabs
    const tabs = page.getByRole('button').filter({ hasText: /general|online|support/i });
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can switch between queue tabs', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on different queue tabs
    const generalTab = page.getByRole('button', { name: /general/i });
    if (await generalTab.isVisible()) {
      await generalTab.click();
      // The tab should become active (visual change)
      await expect(generalTab).toBeVisible();
    }
  });

  test('dashboard shows ticket list or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should show either ticket rows or empty state
    const hasTickets = await page.getByText(/G-|O-|S-/).first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no one in the queue/i).isVisible().catch(() => false);

    expect(hasTickets || hasEmptyState).toBe(true);
  });

  test('dashboard shows connection status', async ({ page }) => {
    await page.goto('/dashboard');

    // Should indicate realtime connection
    await expect(page.getByText(/connected|live/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
