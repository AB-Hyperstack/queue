/**
 * Production Test Suite
 * Full smoke + flow tests against production (queue-olive.vercel.app)
 * Creates real test data and cleans up after each test
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { DEMO_ORG, DEMO_QUEUES, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_MARKER } from './helpers/fixtures';

const createdTicketIds: string[] = [];
const hasServiceKey = !!SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

test.afterAll(async () => {
  if (!hasServiceKey || createdTicketIds.length === 0) return;
  const client = getAdminClient();
  for (const id of createdTicketIds) {
    await client.from('tickets').delete().eq('id', id);
  }
});

test.describe('Production Smoke', () => {
  test('home page returns 200', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('login page returns 200', async ({ page }) => {
    const response = await page.goto('/auth/login');
    expect(response?.status()).toBe(200);
  });

  test('join page for demo org returns 200 with org name', async ({ page }) => {
    const response = await page.goto(`/join/${DEMO_ORG.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
  });

  test('kiosk page for demo org returns 200 with org name', async ({ page }) => {
    const response = await page.goto(`/kiosk/${DEMO_ORG.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
  });

  test('display page for demo org returns 200 with org name', async ({ page }) => {
    const response = await page.goto(`/display/${DEMO_ORG.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Production Join Flow', () => {
  test('customer can join a queue and track ticket', async ({ page }) => {
    await page.goto(`/join/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_ORG.name)).toBeVisible({ timeout: 10_000 });

    // Select General queue
    await page.getByText(DEMO_QUEUES.general.name).click();

    // Fill in name with test marker
    const testName = `Prod Test ${E2E_TEST_MARKER} ${Date.now()}`;
    await page.getByPlaceholder(/enter your name/i).fill(testName);

    // Join the queue (button text is "Join General")
    await page.getByRole('button', { name: /^join\s/i }).click();

    // Should redirect to tracking page
    await page.waitForURL(/\/track\//, { timeout: 15_000 });
    const url = page.url();
    const ticketId = url.split('/track/')[1]?.split('?')[0];

    if (ticketId) {
      createdTicketIds.push(ticketId);
    }

    // Tracking page should show ticket code
    await expect(page.getByText(/G-/)).toBeVisible({ timeout: 10_000 });

    // Should show queue name
    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible();

    // Should show position info
    await expect(page.getByText(/ahead|next|your turn/i)).toBeVisible();
  });
});

test.describe('Production Kiosk Flow', () => {
  test('kiosk can generate a ticket', async ({ page }) => {
    await page.goto(`/kiosk/${DEMO_ORG.slug}`);

    // Click the Support queue button
    const supportButton = page.getByRole('button', { name: /Support/i });
    await expect(supportButton).toBeVisible({ timeout: 10_000 });
    await supportButton.click();

    // Overlay should appear
    await expect(page.getByText(/your number is/i)).toBeVisible({ timeout: 15_000 });

    // Should show a ticket code
    await expect(page.locator('text=/[A-Z]-\\d+/')).toBeVisible();
  });
});

test.describe('Production Display', () => {
  test('display board shows real-time data', async ({ page }) => {
    await page.goto(`/display/${DEMO_ORG.slug}`);

    // Should show all queue names
    await expect(page.getByText(DEMO_QUEUES.general.name, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(DEMO_QUEUES.onlinePickup.name, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(DEMO_QUEUES.support.name, { exact: false }).first()).toBeVisible();

    // Clock should be visible
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/')).toBeVisible();
  });
});

test.describe('Production Tracking', () => {
  test('tracking page loads for ticket created via join flow', async ({ page }) => {
    // Create ticket through the UI join flow (guaranteed to be readable by anon client)
    await page.goto(`/join/${DEMO_ORG.slug}`);
    await expect(page.getByText(DEMO_QUEUES.support.name)).toBeVisible({ timeout: 10_000 });
    await page.getByText(DEMO_QUEUES.support.name).click();

    const testName = `Track Test ${E2E_TEST_MARKER} ${Date.now()}`;
    await page.getByPlaceholder(/enter your name/i).fill(testName);
    await page.getByRole('button', { name: /^join\s/i }).click();

    // Should redirect to tracking page
    await page.waitForURL(/\/track\//, { timeout: 15_000 });
    const url = page.url();
    const ticketId = url.split('/track/')[1]?.split('?')[0];
    if (ticketId) createdTicketIds.push(ticketId);

    // Verify tracking page shows "Your number" label and ticket code
    await expect(page.getByText(/your number/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/S-/)).toBeVisible();
    await expect(page.getByText(DEMO_QUEUES.support.name)).toBeVisible();
  });
});
