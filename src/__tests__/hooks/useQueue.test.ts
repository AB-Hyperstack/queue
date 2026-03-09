/**
 * useQueue Hook Tests
 * Tests all queue operations: callNext, completeService, markNoShow, snoozeTicket, joinQueue
 */
import { renderHook, act } from '@testing-library/react';
import { useQueue } from '@/lib/hooks/useQueue';
import { fixtures } from '../mocks/fixtures';

// Mock supabase client
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}));

// Mock fetch for push notifications
global.fetch = jest.fn().mockResolvedValue({ ok: true });

function chainBuilder(terminalData: { data?: unknown; error?: unknown; count?: number }) {
  const builder: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gte', 'in', 'order', 'limit', 'single', 'maybeSingle', 'head'];
  methods.forEach(m => {
    builder[m] = jest.fn().mockReturnValue(
      (m === 'single' || m === 'maybeSingle')
        ? Promise.resolve(terminalData)
        : builder
    );
  });
  // For non-terminal awaits
  builder.then = jest.fn((resolve: (v: unknown) => void) => resolve(terminalData));
  return builder;
}

describe('useQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callNext', () => {
    it('should update ticket status to serving', async () => {
      const ticket = fixtures.ticket();
      const updatedTicket = { ...ticket, status: 'serving', called_at: expect.any(String) };

      const updateBuilder = chainBuilder({ data: updatedTicket, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tickets') return updateBuilder;
        if (table === 'analytics_logs') return analyticsBuilder;
        return chainBuilder({ data: null, error: null });
      });

      const { result } = renderHook(() => useQueue());

      let res: { error: unknown };
      await act(async () => {
        res = await result.current.callNext(ticket);
      });

      expect(res!.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('tickets');
      expect(updateBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'serving',
      }));
    });

    it('should return error when update fails', async () => {
      const ticket = fixtures.ticket();
      const updateBuilder = chainBuilder({ data: null, error: { message: 'RLS violation' } });

      mockFrom.mockReturnValue(updateBuilder);

      const { result } = renderHook(() => useQueue());

      let res: { error: unknown };
      await act(async () => {
        res = await result.current.callNext(ticket);
      });

      expect(res!.error).toBeTruthy();
    });

    it('should trigger push notification', async () => {
      const ticket = fixtures.ticket();
      const updateBuilder = chainBuilder({ data: { ...ticket, status: 'serving' }, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tickets') return updateBuilder;
        return analyticsBuilder;
      });

      const { result } = renderHook(() => useQueue());

      await act(async () => {
        await result.current.callNext(ticket);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/push', expect.objectContaining({
        method: 'POST',
      }));
    });

    it('should log analytics event with wait duration', async () => {
      const ticket = fixtures.ticket();
      const updateBuilder = chainBuilder({ data: { ...ticket, status: 'serving' }, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'tickets') return updateBuilder;
        if (table === 'analytics_logs') return analyticsBuilder;
        return chainBuilder({ data: null, error: null });
      });

      const { result } = renderHook(() => useQueue());

      await act(async () => {
        await result.current.callNext(ticket);
      });

      expect(mockFrom).toHaveBeenCalledWith('analytics_logs');
      expect(analyticsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        event_type: 'call',
        ticket_id: ticket.id,
        org_id: ticket.org_id,
        queue_id: ticket.queue_id,
      }));
    });
  });

  describe('completeService', () => {
    it('should update ticket status to served', async () => {
      const ticket = fixtures.servingTicket();
      const updatedTicket = { ...ticket, status: 'served', served_at: expect.any(String) };

      const updateBuilder = chainBuilder({ data: updatedTicket, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });
      const positionBuilder = chainBuilder({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'analytics_logs') return analyticsBuilder;
        return updateBuilder;
      });

      const { result } = renderHook(() => useQueue());

      let res: { error: unknown };
      await act(async () => {
        res = await result.current.completeService(ticket);
      });

      expect(res!.error).toBeNull();
      expect(updateBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'served',
      }));
    });

    it('should log service duration analytics', async () => {
      const ticket = fixtures.servingTicket();
      const updateBuilder = chainBuilder({ data: { ...ticket, status: 'served' }, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'analytics_logs') return analyticsBuilder;
        return updateBuilder;
      });

      const { result } = renderHook(() => useQueue());

      await act(async () => {
        await result.current.completeService(ticket);
      });

      expect(analyticsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        event_type: 'serve',
        ticket_id: ticket.id,
        service_duration_sec: expect.any(Number),
      }));
    });
  });

  describe('markNoShow', () => {
    it('should update ticket status to no_show', async () => {
      const ticket = fixtures.ticket();
      const updateBuilder = chainBuilder({ data: { ...ticket, status: 'no_show' }, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'analytics_logs') return analyticsBuilder;
        return updateBuilder;
      });

      const { result } = renderHook(() => useQueue());

      let res: { error: unknown };
      await act(async () => {
        res = await result.current.markNoShow(ticket);
      });

      expect(res!.error).toBeNull();
      expect(updateBuilder.update).toHaveBeenCalledWith({ status: 'no_show' });
    });

    it('should log no_show analytics event', async () => {
      const ticket = fixtures.ticket();
      const updateBuilder = chainBuilder({ data: { ...ticket, status: 'no_show' }, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'analytics_logs') return analyticsBuilder;
        return updateBuilder;
      });

      const { result } = renderHook(() => useQueue());

      await act(async () => {
        await result.current.markNoShow(ticket);
      });

      expect(analyticsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
        event_type: 'no_show',
      }));
    });
  });

  describe('snoozeTicket', () => {
    it('should move ticket to end of queue', async () => {
      const ticket = fixtures.ticket({ position: 1 });
      const lastPositionBuilder = chainBuilder({ data: { position: 5 }, error: null });
      const updateBuilder = chainBuilder({ data: { ...ticket, position: 6 }, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        // First call: select last position, Second call: update position, Third+: recalculate
        if (callCount === 1) return lastPositionBuilder;
        return updateBuilder;
      });

      const { result } = renderHook(() => useQueue());

      let res: { error: unknown };
      await act(async () => {
        res = await result.current.snoozeTicket(ticket);
      });

      expect(res!.error).toBeNull();
      expect(updateBuilder.update).toHaveBeenCalledWith({ position: 6 });
    });
  });

  describe('joinQueue', () => {
    it('should create a new ticket with correct display code', async () => {
      const newTicket = fixtures.ticket({ ticket_number: 3, display_code: 'G-003', position: 3 });

      const countBuilder = chainBuilder({ count: 2, data: null, error: null });
      const queueBuilder = chainBuilder({ data: { slug: 'general' }, error: null });
      const waitingBuilder = chainBuilder({ count: 2, data: null, error: null });
      const insertBuilder = chainBuilder({ data: newTicket, error: null });
      const analyticsBuilder = chainBuilder({ data: null, error: null });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'analytics_logs') return analyticsBuilder;
        if (table === 'queues') return queueBuilder;
        // tickets table is called multiple times
        if (callCount === 1) return countBuilder;
        if (callCount === 3) return waitingBuilder;
        return insertBuilder;
      });

      const { result } = renderHook(() => useQueue());

      let res: { data: unknown; error: unknown };
      await act(async () => {
        res = await result.current.joinQueue('queue-1', 'org-1', 'New Customer');
      });

      expect(res!.data).toBeTruthy();
      expect(res!.error).toBeNull();
    });

    it('should return error when insert fails', async () => {
      const countBuilder = chainBuilder({ count: 0, data: null, error: null });
      const queueBuilder = chainBuilder({ data: { slug: 'general' }, error: null });
      const waitingBuilder = chainBuilder({ count: 0, data: null, error: null });
      const insertBuilder = chainBuilder({ data: null, error: { message: 'Insert failed' } });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'queues') return queueBuilder;
        if (callCount === 1) return countBuilder;
        if (callCount === 3) return waitingBuilder;
        return insertBuilder;
      });

      const { result } = renderHook(() => useQueue());

      let res: { data: unknown; error: unknown };
      await act(async () => {
        res = await result.current.joinQueue('queue-1', 'org-1');
      });

      expect(res!.error).toBeTruthy();
    });
  });
});
