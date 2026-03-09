/**
 * Shared constants for E2E tests
 * Demo org is pre-seeded via supabase/seed.sql
 */

export const DEMO_ORG = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo Clinic',
  slug: 'demo',
};

export const DEMO_QUEUES = {
  general: {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'General',
    slug: 'general',
    color: '#0D9488',
    avgServiceTime: 5,
  },
  onlinePickup: {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'Online Pick Up',
    slug: 'online-pickup',
    color: '#F59E0B',
    avgServiceTime: 3,
  },
  support: {
    id: '00000000-0000-0000-0000-000000000012',
    name: 'Support',
    slug: 'support',
    color: '#3B82F6',
    avgServiceTime: 10,
  },
};

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpfehcdpfcawnqsihxfz.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/** Marker to identify E2E-created test data for cleanup */
export const E2E_TEST_MARKER = 'E2E_TEST';
