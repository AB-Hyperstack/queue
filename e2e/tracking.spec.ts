/**
 * Suite 7: Ticket Tracking Page Tests
 * Tests the customer-facing ticket tracking experience
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { DEMO_ORG, DEMO_QUEUES, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_MARKER } from './helpers/fixtures';

const hasServiceKey = !!SUPABASE_SERVICE_ROLE_KEY;
let testTicketIds: string[] = [];

async function createTestTicket(queueId: string, displayCode: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await client
    .from('tickets')
    .insert({
      queue_id: queueId,
      org_id: DEMO_ORG.id,
      ticket_number: 900 + Math.floor(Math.random() * 100),
      display_code: displayCode,
      customer_name: `Track Test ${E2E_TEST_MARKER}`,
      status: 'waiting',
      position: 99,
    })
    .select('id')
    .single();

  if (error) throw error;
  testTicketIds.push(data.id);
  return data.id;
}

test.describe('Ticket Tracking', () => {
  test.skip(!hasServiceKey, 'Skipped: SUPABASE_SERVICE_ROLE_KEY not set');

  test.afterAll(async () => {
    if (!hasServiceKey || testTicketIds.length === 0) return;
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    for (const id of testTicketIds) {
      await client.from('tickets').delete().eq('id', id);
    }
    testTicketIds = [];
  });

  test('tracking page shows ticket display code', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.general.id, 'G-900');

    await page.goto(`/track/${ticketId}`);

    await expect(page.getByText('G-900')).toBeVisible({ timeout: 10_000 });
  });

  test('tracking page shows queue name', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.general.id, 'G-901');

    await page.goto(`/track/${ticketId}`);

    await expect(page.getByText(DEMO_QUEUES.general.name)).toBeVisible({ timeout: 10_000 });
  });

  test('tracking page shows position information', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.general.id, 'G-902');

    await page.goto(`/track/${ticketId}`);

    // Should show either "people ahead" or "person ahead" or "You're next"
    await expect(
      page.getByText(/ahead|next|your turn/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('tracking page shows estimated wait time', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.general.id, 'G-903');

    await page.goto(`/track/${ticketId}`);

    await expect(page.getByText(/estimated wait/i)).toBeVisible({ timeout: 10_000 });
  });

  test('tracking page shows QueueFlow branding', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.support.id, 'S-900');

    await page.goto(`/track/${ticketId}`);

    await expect(page.getByText('QueueFlow', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('tracking page shows "Your number" label', async ({ page }) => {
    const ticketId = await createTestTicket(DEMO_QUEUES.general.id, 'G-904');

    await page.goto(`/track/${ticketId}`);

    await expect(page.getByText(/your number/i)).toBeVisible({ timeout: 10_000 });
  });

  test('invalid ticket ID shows error', async ({ page }) => {
    await page.goto('/track/00000000-0000-0000-0000-000000000099');

    await expect(page.getByText(/not found|error|invalid/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
