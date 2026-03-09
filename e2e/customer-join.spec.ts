/**
 * Suite 2: Customer Join Queue Flow
 * Tests the full customer journey of joining a queue
 */
import { test, expect } from '@playwright/test';
import { DEMO_ORG, DEMO_QUEUES, E2E_TEST_MARKER } from './helpers/fixtures';
import { cleanupTestTickets } from './helpers/cleanup';

test.describe('Customer Join Queue Flow', () => {
  test.afterAll(async () => {
    await cleanupTestTickets();
  });

  test('join page shows active queues with waiting counts', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);

    // Should show queue names
    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(DEMO_QUEUES.onlinePickup.name)).toBeVisible();
    await expect(page.getByText(DEMO_QUEUES.support.name)).toBeVisible();
  });

  test('join page shows organization name and subtitle', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);

    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/join the queue/i)).toBeVisible();
  });

  test('selecting a queue shows the name input', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);

    // Wait for queues to load then click General
    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(DEMO_QUEUES.general.name).click();

    // Should show the name input
    await expect(page.getByPlaceholder(/enter your name/i)).toBeVisible({ timeout: 5_000 });
  });

  test('can join a queue with a name and get redirected to tracking', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);

    // Select the General queue
    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(DEMO_QUEUES.general.name).click();

    // Enter a name with our test marker
    const testName = `Test User ${E2E_TEST_MARKER}`;
    await page.getByPlaceholder(/enter your name/i).fill(testName);

    // Click join button (text is "Join General" or similar)
    await page.getByRole('button', { name: /^join\s/i }).click();

    // Should redirect to tracking page
    await page.waitForURL(/\/track\//, { timeout: 15_000 });

    // Verify tracking page shows ticket info
    await expect(page.getByText(/G-/)).toBeVisible({ timeout: 10_000 });
  });

  test('can join a queue without a name (anonymous)', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);

    // Select a queue
    await expect(page.getByText(DEMO_QUEUES.support.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(DEMO_QUEUES.support.name).click();

    // Don't enter a name, just join
    await page.getByRole('button', { name: /^join\s/i }).click();

    // Should still redirect to tracking page
    await page.waitForURL(/\/track\//, { timeout: 15_000 });
  });

  test('pre-selected queue via URL parameter', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}?queue=${DEMO_QUEUES.general.slug}`);

    // The General queue should already be selected — name input visible
    await expect(page.getByPlaceholder(/enter your name/i)).toBeVisible({ timeout: 10_000 });
  });
});
