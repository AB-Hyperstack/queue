/**
 * @jest-environment node
 */
/**
 * API Route Tests: /api/tickets
 * Tests ticket creation endpoint
 */
import { POST } from '@/app/api/tickets/route';

// Mock supabase server client
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

function chainBuilder(overrides: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  const builder: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'eq', 'gte', 'in', 'order', 'limit', 'single', 'head'];
  const terminal = { data: overrides.data ?? null, error: overrides.error ?? null, count: overrides.count ?? null };

  methods.forEach(m => {
    builder[m] = jest.fn().mockReturnValue(
      (m === 'single') ? Promise.resolve(terminal) : builder
    );
  });
  builder.then = jest.fn((resolve: (v: unknown) => void) => resolve(terminal));
  return builder;
}

describe('POST /api/tickets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when queueId is missing', async () => {
    const req = new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org-1' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('queueId');
  });

  it('should return 400 when orgId is missing', async () => {
    const req = new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ queueId: 'queue-1' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('orgId');
  });

  it('should create a ticket with correct display code', async () => {
    const createdTicket = {
      id: 'ticket-new',
      queue_id: 'queue-1',
      org_id: 'org-1',
      ticket_number: 4,
      display_code: 'G-004',
      status: 'waiting',
      position: 3,
    };

    const countBuilder = chainBuilder({ count: 3, data: null });
    const queueBuilder = chainBuilder({ data: { slug: 'general' } });
    const waitingBuilder = chainBuilder({ count: 2, data: null });
    const insertBuilder = chainBuilder({ data: createdTicket });
    const analyticsBuilder = chainBuilder({ data: null });

    let ticketCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'queues') return queueBuilder;
      if (table === 'analytics_logs') return analyticsBuilder;
      ticketCallCount++;
      if (ticketCallCount === 1) return countBuilder;
      if (ticketCallCount === 2) return waitingBuilder;
      return insertBuilder;
    });

    const req = new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({
        queueId: 'queue-1',
        orgId: 'org-1',
        customerName: 'Test Customer',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(createdTicket);
  });

  it('should return 500 when insert fails', async () => {
    const countBuilder = chainBuilder({ count: 0 });
    const queueBuilder = chainBuilder({ data: { slug: 'general' } });
    const waitingBuilder = chainBuilder({ count: 0 });
    const insertBuilder = chainBuilder({ data: null, error: { message: 'Database error' } });

    let ticketCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'queues') return queueBuilder;
      if (table === 'analytics_logs') return chainBuilder({});
      ticketCallCount++;
      if (ticketCallCount === 1) return countBuilder;
      if (ticketCallCount === 2) return waitingBuilder;
      return insertBuilder;
    });

    const req = new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ queueId: 'queue-1', orgId: 'org-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('should log analytics event on successful creation', async () => {
    const createdTicket = { id: 'ticket-new', queue_id: 'queue-1', org_id: 'org-1' };
    const analyticsBuilder = chainBuilder({ data: null });

    let ticketCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'queues') return chainBuilder({ data: { slug: 'general' } });
      if (table === 'analytics_logs') return analyticsBuilder;
      ticketCallCount++;
      if (ticketCallCount <= 2) return chainBuilder({ count: 0 });
      return chainBuilder({ data: createdTicket });
    });

    const req = new Request('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ queueId: 'queue-1', orgId: 'org-1' }),
    });

    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith('analytics_logs');
    expect(analyticsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'join',
      ticket_id: 'ticket-new',
    }));
  });
});
