/**
 * @jest-environment node
 */
/**
 * API Route Tests: /api/push
 * Tests push notification endpoint
 */
import { POST } from '@/app/api/push/route';

const mockFrom = jest.fn();
const mockSendNotification = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

jest.mock('web-push', () => {
  const mod = {
    setVapidDetails: jest.fn(),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  };
  return {
    ...mod,
    default: mod,
    __esModule: true,
  };
});

function chainBuilder(overrides: { data?: unknown; error?: unknown } = {}) {
  const builder: Record<string, jest.Mock> = {};
  const methods = ['select', 'eq', 'single'];
  const terminal = { data: overrides.data ?? null, error: overrides.error ?? null };

  methods.forEach(m => {
    builder[m] = jest.fn().mockReturnValue(
      m === 'single' ? Promise.resolve(terminal) : builder
    );
  });
  return builder;
}

describe('POST /api/push', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when ticketId is missing', async () => {
    const req = new Request('http://localhost/api/push', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('ticketId');
  });

  it('should return message when no push subscription exists', async () => {
    const ticketBuilder = chainBuilder({
      data: {
        id: 'ticket-1',
        push_subscription: null,
        display_code: 'G-001',
        queues: { name: 'General' },
      },
    });

    mockFrom.mockReturnValue(ticketBuilder);

    const req = new Request('http://localhost/api/push', {
      method: 'POST',
      body: JSON.stringify({ ticketId: 'ticket-1' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('No push subscription');
  });

  it('should send push notification when subscription exists', async () => {
    const pushSub = {
      endpoint: 'https://push.example.com/123',
      keys: { p256dh: 'test-key', auth: 'test-auth' },
    };

    const ticketBuilder = chainBuilder({
      data: {
        id: 'ticket-1',
        push_subscription: pushSub,
        display_code: 'G-001',
        queues: { name: 'General' },
      },
    });

    mockFrom.mockReturnValue(ticketBuilder);
    mockSendNotification.mockResolvedValue({});

    const req = new Request('http://localhost/api/push', {
      method: 'POST',
      body: JSON.stringify({ ticketId: 'ticket-1' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSendNotification).toHaveBeenCalledWith(
      pushSub,
      expect.stringContaining('your turn')
    );
  });

  it('should return 500 when push notification fails', async () => {
    const pushSub = {
      endpoint: 'https://push.example.com/123',
      keys: { p256dh: 'test-key', auth: 'test-auth' },
    };

    const ticketBuilder = chainBuilder({
      data: {
        id: 'ticket-1',
        push_subscription: pushSub,
        display_code: 'G-001',
        queues: { name: 'General' },
      },
    });

    mockFrom.mockReturnValue(ticketBuilder);
    mockSendNotification.mockRejectedValue(new Error('Push service down'));

    const req = new Request('http://localhost/api/push', {
      method: 'POST',
      body: JSON.stringify({ ticketId: 'ticket-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
