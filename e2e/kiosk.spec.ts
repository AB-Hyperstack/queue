/**
 * Suite 3: Kiosk Flow
 * Tests the kiosk take-a-number experience
 */
import { test, expect } from '@playwright/test';
import { DEMO_ORG, DEMO_QUEUES } from './helpers/fixtures';
import { cleanupRecentTickets } from './helpers/cleanup';

test.describe('Kiosk Flow', () => {
  test.afterAll(async () => {
    await cleanupRecentTickets();
  });

  test('kiosk page shows queue buttons with names', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(DEMO_QUEUES.onlinePickup.name)).toBeVisible();
    await expect(page.getByText(DEMO_QUEUES.support.name)).toBeVisible();
  });

  test('kiosk shows organization name and instructions', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/tap a queue to take a number/i)).toBeVisible();
  });

  test('kiosk shows "Take a Number" buttons', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    const takeNumberButtons = page.getByText(/take a number/i);
    await expect(takeNumberButtons.first()).toBeVisible({ timeout: 10_000 });
    const count = await takeNumberButtons.count();
    expect(count).toBeGreaterThanOrEqual(3); // One per queue
  });

  test('tapping a queue button shows ticket overlay with display code', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    // Click the Support queue button (last queue, least busy)
    const supportButton = page.getByRole('button', { name: /Support/i });
    await expect(supportButton).toBeVisible({ timeout: 10_000 });
    await supportButton.click();

    // Overlay should appear with ticket code — wait generously for the API call
    await expect(page.getByText(/your number is/i)).toBeVisible({ timeout: 15_000 });

    // Should show a display code pattern (letter-number like S-005)
    await expect(page.locator('text=/[A-Z]-\\d+/')).toBeVisible();
  });

  test('ticket overlay shows scan instructions', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    const supportButton = page.getByRole('button', { name: /Support/i });
    await expect(supportButton).toBeVisible({ timeout: 10_000 });
    await supportButton.click();

    // Wait for overlay
    await expect(page.getByText(/your number is/i)).toBeVisible({ timeout: 15_000 });

    // Should show scan instructions
    await expect(page.getByText(/scan to track/i)).toBeVisible();
  });

  test('ticket overlay auto-dismisses', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    const supportButton = page.getByRole('button', { name: /Support/i });
    await expect(supportButton).toBeVisible({ timeout: 10_000 });
    await supportButton.click();

    // Overlay visible
    await expect(page.getByText(/your number is/i)).toBeVisible({ timeout: 15_000 });

    // Overlay should dismiss after ~12 seconds
    await expect(page.getByText(/your number is/i)).toBeHidden({ timeout: 18_000 });
  });

  test('kiosk shows waiting and serving stats per queue', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    // Should show "Waiting" and "Now Serving" labels
    await expect(page.getByText(/waiting/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/now serving/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
