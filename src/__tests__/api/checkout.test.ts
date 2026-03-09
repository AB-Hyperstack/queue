/**
 * @jest-environment node
 */
/**
 * API Route Tests: /api/checkout
 * Tests Stripe checkout session creation
 */
import { POST } from '@/app/api/checkout/route';

const mockFrom = jest.fn();
const mockGetUser = jest.fn();
const mockStripeCustomersCreate = jest.fn();
const mockStripeCheckoutCreate = jest.fn();
const mockAdminFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: () => mockGetUser() },
  }),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockAdminFrom(...args),
  },
}));

jest.mock('@/lib/stripe/stripe', () => ({
  stripe: {
    customers: { create: (...args: unknown[]) => mockStripeCustomersCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockStripeCheckoutCreate(...args) } },
  },
}));

function chainBuilder(overrides: { data?: unknown; error?: unknown } = {}) {
  const builder: Record<string, jest.Mock> = {};
  const methods = ['select', 'update', 'eq', 'single'];
  const terminal = { data: overrides.data ?? null, error: overrides.error ?? null };
  methods.forEach(m => {
    builder[m] = jest.fn().mockReturnValue(m === 'single' ? Promise.resolve(terminal) : builder);
  });
  return builder;
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid plan', async () => {
    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'invalid' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'monthly' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 when user has no organization', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } });
    mockFrom.mockReturnValue(chainBuilder({ data: null }));

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'monthly' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should create Stripe customer if none exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } });

    const staffBuilder = chainBuilder({ data: { org_id: 'org-1' } });
    const subBuilder = chainBuilder({ data: { id: 'sub-1', stripe_customer_id: null } });
    const adminUpdateBuilder = chainBuilder({ data: null });

    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return staffBuilder;
      return subBuilder;
    });

    mockAdminFrom.mockReturnValue(adminUpdateBuilder);
    mockStripeCustomersCreate.mockResolvedValue({ id: 'cus_new123' });
    mockStripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: JSON.stringify({ plan: 'monthly' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/test');
    expect(mockStripeCustomersCreate).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@test.com',
    }));
  });

  it('should reuse existing Stripe customer', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.com' } } });

    const staffBuilder = chainBuilder({ data: { org_id: 'org-1' } });
    const subBuilder = chainBuilder({ data: { id: 'sub-1', stripe_customer_id: 'cus_existing' } });

    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return staffBuilder;
      return subBuilder;
    });

    mockStripeCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    const req = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: JSON.stringify({ plan: 'yearly' }),
    });

    await POST(req);

    expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_existing',
      mode: 'subscription',
    }));
  });
});
