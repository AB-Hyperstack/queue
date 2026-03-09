/**
 * Database Types Tests
 * Validates type structure and fixture conformance
 */
import { fixtures } from '../mocks/fixtures';
import type { TicketStatus, StaffRole, AnalyticsEventType } from '@/lib/types/database';

describe('Database Types', () => {
  describe('Ticket', () => {
    it('should have all required fields', () => {
      const ticket = fixtures.ticket();
      expect(ticket.id).toBeDefined();
      expect(ticket.queue_id).toBeDefined();
      expect(ticket.org_id).toBeDefined();
      expect(ticket.ticket_number).toBeDefined();
      expect(ticket.display_code).toBeDefined();
      expect(ticket.status).toBeDefined();
      expect(ticket.joined_at).toBeDefined();
      expect(ticket.created_at).toBeDefined();
    });

    it('should accept all valid ticket statuses', () => {
      const statuses: TicketStatus[] = ['waiting', 'serving', 'served', 'no_show', 'cancelled'];
      statuses.forEach(status => {
        const ticket = fixtures.ticket({ status });
        expect(ticket.status).toBe(status);
      });
    });

    it('should allow null for optional fields', () => {
      const ticket = fixtures.ticket({
        customer_name: null,
        customer_phone: null,
        called_at: null,
        served_at: null,
        push_subscription: null,
        position: null,
      });
      expect(ticket.customer_name).toBeNull();
      expect(ticket.called_at).toBeNull();
      expect(ticket.position).toBeNull();
    });
  });

  describe('Queue', () => {
    it('should have all required fields', () => {
      const queue = fixtures.queue();
      expect(queue.id).toBeDefined();
      expect(queue.org_id).toBeDefined();
      expect(queue.name).toBeDefined();
      expect(queue.slug).toBeDefined();
      expect(queue.color).toBeDefined();
      expect(typeof queue.is_active).toBe('boolean');
      expect(typeof queue.avg_service_time_min).toBe('number');
    });
  });

  describe('Organization', () => {
    it('should have all required fields', () => {
      const org = fixtures.organization();
      expect(org.id).toBeDefined();
      expect(org.name).toBeDefined();
      expect(org.slug).toBeDefined();
      expect(typeof org.settings).toBe('object');
    });
  });

  describe('Subscription', () => {
    it('should have all required fields', () => {
      const sub = fixtures.subscription();
      expect(sub.id).toBeDefined();
      expect(sub.org_id).toBeDefined();
      expect(sub.status).toBeDefined();
      expect(sub.trial_start).toBeDefined();
      expect(sub.trial_end).toBeDefined();
    });

    it('should accept all valid subscription statuses', () => {
      const statuses = ['trialing', 'active', 'past_due', 'canceled', 'expired'] as const;
      statuses.forEach(status => {
        const sub = fixtures.subscription({ status });
        expect(sub.status).toBe(status);
      });
    });
  });

  describe('Enums', () => {
    it('should validate StaffRole values', () => {
      const roles: StaffRole[] = ['owner', 'admin', 'staff'];
      expect(roles).toHaveLength(3);
    });

    it('should validate AnalyticsEventType values', () => {
      const events: AnalyticsEventType[] = ['join', 'call', 'serve', 'no_show', 'cancel'];
      expect(events).toHaveLength(5);
    });
  });
});
