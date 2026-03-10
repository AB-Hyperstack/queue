// Chainable query builder mock
export function createMockQueryBuilder(overrides: Record<string, unknown> = {}) {
  const builder: Record<string, jest.Mock> = {};
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in',
    'order', 'limit', 'single', 'maybeSingle', 'head',
    'filter', 'match', 'then',
  ];

  const terminalResult = {
    data: overrides.data ?? null,
    error: overrides.error ?? null,
    count: overrides.count ?? null,
  };

  chainMethods.forEach(method => {
    builder[method] = jest.fn().mockReturnValue(
      method === 'single' || method === 'maybeSingle'
        ? Promise.resolve(terminalResult)
        : builder
    );
  });

  // Make the builder thenable for await
  builder.then = jest.fn((resolve: (v: unknown) => void) => resolve(terminalResult));

  return builder;
}

export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const queryBuilder = createMockQueryBuilder(overrides);

  const client = {
    from: jest.fn().mockReturnValue(queryBuilder),
    rpc: jest.fn().mockResolvedValue({ data: overrides.rpcData ?? null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: overrides.user ?? null },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: overrides.session ?? null },
        error: null,
      }),
    },
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((cb?: (status: string) => void) => {
        if (cb) cb('SUBSCRIBED');
        return { unsubscribe: jest.fn() };
      }),
    }),
    removeChannel: jest.fn(),
    _queryBuilder: queryBuilder,
  };

  return client;
}

// Re-usable ticket fixtures
export const mockTicket = {
  id: 'ticket-1',
  queue_id: 'queue-1',
  org_id: 'org-1',
  ticket_number: 1,
  display_code: 'G-001',
  customer_name: 'John Doe',
  customer_phone: '+46701234567',
  status: 'waiting' as const,
  position: 1,
  joined_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
  called_at: null,
  served_at: null,
  push_subscription: null,
  metadata: {},
  created_at: new Date().toISOString(),
};

export const mockQueue = {
  id: 'queue-1',
  org_id: 'org-1',
  name: 'General',
  slug: 'general',
  color: '#3b82f6',
  is_active: true,
  avg_service_time_min: 5,
  created_at: new Date().toISOString(),
};

export const mockOrganization = {
  id: 'org-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  settings: {},
  created_at: new Date().toISOString(),
};
