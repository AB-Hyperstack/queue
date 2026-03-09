/**
 * Billing Constants Tests
 * Tests plan configuration and pricing logic
 */
import { PLANS, TRIAL_DURATION_DAYS, TRIAL_WARNING_DAYS, PLAN_FEATURES } from '@/lib/billing/constants';

describe('Billing Constants', () => {
  describe('PLANS', () => {
    it('should have monthly and yearly plans', () => {
      expect(PLANS.monthly).toBeDefined();
      expect(PLANS.yearly).toBeDefined();
    });

    it('monthly plan should cost 500 kr', () => {
      expect(PLANS.monthly.price).toBe(500);
      expect(PLANS.monthly.priceDisplay).toBe('500 kr');
      expect(PLANS.monthly.interval).toBe('month');
    });

    it('yearly plan should cost 5000 kr', () => {
      expect(PLANS.yearly.price).toBe(5000);
      expect(PLANS.yearly.priceDisplay).toBe('5 000 kr');
      expect(PLANS.yearly.interval).toBe('year');
    });

    it('yearly plan should be cheaper per month than monthly', () => {
      const yearlyMonthly = PLANS.yearly.price / 12;
      expect(yearlyMonthly).toBeLessThan(PLANS.monthly.price);
    });

    it('yearly plan should show 17% savings', () => {
      expect(PLANS.yearly.savings).toBe('17%');
    });

    it('should have correct plan IDs', () => {
      expect(PLANS.monthly.id).toBe('monthly');
      expect(PLANS.yearly.id).toBe('yearly');
    });
  });

  describe('Trial Configuration', () => {
    it('trial should be 14 days', () => {
      expect(TRIAL_DURATION_DAYS).toBe(14);
    });

    it('trial warning should trigger at 3 days', () => {
      expect(TRIAL_WARNING_DAYS).toBe(3);
    });

    it('warning days should be less than trial duration', () => {
      expect(TRIAL_WARNING_DAYS).toBeLessThan(TRIAL_DURATION_DAYS);
    });
  });

  describe('Plan Features', () => {
    it('should include key features', () => {
      expect(PLAN_FEATURES).toContain('Unlimited queues');
      expect(PLAN_FEATURES).toContain('Real-time analytics');
      expect(PLAN_FEATURES).toContain('Push notifications');
      expect(PLAN_FEATURES).toContain('QR codes & kiosk mode');
    });

    it('should have at least 5 features', () => {
      expect(PLAN_FEATURES.length).toBeGreaterThanOrEqual(5);
    });
  });
});
