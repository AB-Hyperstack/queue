/**
 * Suite 8: Customer Feedback Tests
 * Tests the feedback form on the ticket tracking page
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { DEMO_ORG, DEMO_QUEUES, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_MARKER } from './helpers/fixtures';

const hasServiceKey = !!SUPABASE_SERVICE_ROLE_KEY;
let testTicketIds: string[] = [];

async function createServedTicket(queueId: string, displayCode: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await client
    .from('tickets')
    .insert({
      queue_id: queueId,
      org_id: DEMO_ORG.id,
      ticket_number: 800 + Math.floor(Math.random() * 100),
      display_code: displayCode,
      customer_name: `Feedback Test ${E2E_TEST_MARKER}`,
      status: 'served',
      position: null,
      served_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  testTicketIds.push(data.id);
  return data.id;
}

test.describe('Customer Feedback', () => {
  test.skip(!hasServiceKey, 'Skipped: SUPABASE_SERVICE_ROLE_KEY not set');

  test.afterAll(async () => {
    if (!hasServiceKey || testTicketIds.length === 0) return;
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // Clean up feedback first (FK constraint), then tickets
    for (const id of testTicketIds) {
      await client.from('feedback').delete().eq('ticket_id', id);
      await client.from('tickets').delete().eq('id', id);
    }
    testTicketIds = [];
  });

  test('shows feedback form when ticket is served', async ({ page }) => {
    const ticketId = await createServedTicket(DEMO_QUEUES.general.id, 'G-800');
    await page.goto(`/track/${ticketId}`);
    await expect(page.getByText(/how was your experience/i)).toBeVisible({ timeout: 10_000 });
  });

  test('does not show feedback form when ticket is waiting', async ({ page }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await client
      .from('tickets')
      .insert({
        queue_id: DEMO_QUEUES.general.id,
        org_id: DEMO_ORG.id,
        ticket_number: 850,
        display_code: 'G-850',
        customer_name: `Feedback Test ${E2E_TEST_MARKER}`,
        status: 'waiting',
        position: 1,
      })
      .select('id')
      .single();

    testTicketIds.push(data!.id);
    await page.goto(`/track/${data!.id}`);

    // Wait for page to load, then verify no feedback form
    await expect(page.getByText('G-850')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/how was your experience/i)).not.toBeVisible();
  });

  test('shows thank you on reload after feedback exists', async ({ page }) => {
    const ticketId = await createServedTicket(DEMO_QUEUES.general.id, 'G-802');

    // Insert feedback directly via service role
    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await client.from('feedback').insert({
      ticket_id: ticketId,
      org_id: DEMO_ORG.id,
      queue_id: DEMO_QUEUES.general.id,
      rating: 5,
    });

    await page.goto(`/track/${ticketId}`);

    // Should show thank you, not the form
    await expect(page.getByText(/thank you/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/how was your experience/i)).not.toBeVisible();
  });
});
