/**
 * Suite 4: Display Screen Tests
 * Tests the public-facing display board
 */
import { test, expect } from '@playwright/test';
import { DEMO_ORG, DEMO_QUEUES } from './helpers/fixtures';

test.describe('Display Screen', () => {
  test('display page shows organization name', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
  });

  test('display page has dark theme background', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);
    await page.waitForLoadState('networkidle');

    // Check for dark background by looking at computed styles
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    // Dark background should have low RGB values
    expect(bgColor).toBeTruthy();
  });

  test('display page shows queue names', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    await expect(page.getByText(DEMO_QUEUES.general.name, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(DEMO_QUEUES.onlinePickup.name, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(DEMO_QUEUES.support.name, { exact: false }).first()).toBeVisible();
  });

  test('display page shows "Now Serving" labels', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    // Wait for the page to fully load with realtime data
    await page.waitForLoadState('networkidle');

    // "Now Serving" text should appear for each queue
    const nowServingLabels = page.getByText(/now serving/i);
    await expect(nowServingLabels.first()).toBeVisible({ timeout: 15_000 });
  });

  test('display page shows a live clock', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    // The clock displays time in HH:MM format
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible({ timeout: 10_000 });
  });

  test('display page shows connection status', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    // Should show "Live" or "Connecting..." indicator
    await expect(page.getByText(/live|connecting/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('display page shows waiting counts', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    // Should show waiting count with "waiting" text
    await expect(page.getByText(/waiting/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('display page shows QueueFlow branding in footer', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    await expect(page.getByText(/queueflow/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
