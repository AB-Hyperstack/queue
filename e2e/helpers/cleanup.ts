/**
 * Test data cleanup utilities
 * Uses Supabase service role to bypass RLS and delete test-created data
 */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_ORG, E2E_TEST_MARKER } from './fixtures';

function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for cleanup');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Delete a specific ticket by ID
 */
export async function deleteTicket(ticketId: string) {
  const client = getAdminClient();
  const { error } = await client.from('tickets').delete().eq('id', ticketId);
  if (error) console.warn(`Failed to delete ticket ${ticketId}:`, error.message);
}

/**
 * Delete all tickets created by E2E tests (identified by customer_name containing the marker)
 */
export async function cleanupTestTickets() {
  const client = getAdminClient();
  const { error } = await client
    .from('tickets')
    .delete()
    .eq('org_id', DEMO_ORG.id)
    .like('customer_name', `%${E2E_TEST_MARKER}%`);

  if (error) console.warn('Failed to cleanup test tickets:', error.message);
}

/**
 * Delete tickets created very recently (last 5 minutes) for the demo org
 * Useful as a broad cleanup when marker-based cleanup isn't possible (e.g. anonymous tickets)
 */
export async function cleanupRecentTickets(minutesAgo = 5) {
  const client = getAdminClient();
  const cutoff = new Date(Date.now() - minutesAgo * 60_000).toISOString();

  const { error } = await client
    .from('tickets')
    .delete()
    .eq('org_id', DEMO_ORG.id)
    .gte('joined_at', cutoff)
    .not('display_code', 'in', '("G-000","G-001","G-002","G-003","G-004","O-001","O-002","S-001")');

  if (error) console.warn('Failed to cleanup recent tickets:', error.message);
}
