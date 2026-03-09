/**
 * useSubscription Hook Tests
 * Tests subscription status derivation logic
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { fixtures } from '../mocks/fixtures';

const mockRpc = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockRpc.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useSubscription());
    expect(result.current.loading).toBe(true);
  });

  it('should detect active subscription', async () => {
    const status = fixtures.subscriptionStatus({ status: 'active', plan: 'monthly' });
    mockRpc.mockResolvedValue({ data: status, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isActive).toBe(true);
    expect(result.current.isTrialing).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.showWarning).toBe(false);
  });

  it('should detect trialing subscription with access', async () => {
    const status = fixtures.trialingSubscriptionStatus();
    mockRpc.mockResolvedValue({ data: status, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isTrialing).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.daysRemaining).toBe(7);
    expect(result.current.showWarning).toBe(false); // 7 > TRIAL_WARNING_DAYS (3)
  });

  it('should show warning when trial days remaining <= 3', async () => {
    const status = fixtures.trialingSubscriptionStatus({ trial_days_remaining: 2 });
    mockRpc.mockResolvedValue({ data: status, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isTrialing).toBe(true);
    expect(result.current.showWarning).toBe(true);
    expect(result.current.daysRemaining).toBe(2);
  });

  it('should detect expired subscription without access', async () => {
    const status = fixtures.expiredSubscriptionStatus();
    mockRpc.mockResolvedValue({ data: status, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isTrialing).toBe(false);
    expect(result.current.isActive).toBe(false);
  });

  it('should detect canceled subscription without access', async () => {
    const status = fixtures.subscriptionStatus({ status: 'canceled' });
    mockRpc.mockResolvedValue({ data: status, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isCanceled).toBe(true);
    expect(result.current.hasAccess).toBe(false);
  });

  it('should handle null subscription gracefully', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subscription).toBeNull();
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.showWarning).toBe(false);
  });

  it('should call get_subscription_status RPC', async () => {
    mockRpc.mockResolvedValue({ data: fixtures.subscriptionStatus(), error: null });

    renderHook(() => useSubscription());

    await waitFor(() => expect(mockRpc).toHaveBeenCalledWith('get_subscription_status'));
  });
});
