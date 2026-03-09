/**
 * @jest-environment node
 */
/**
 * Middleware Tests
 * Tests authentication, onboarding, subscription gating, and admin access
 */
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: () => mockGetUser() },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}));

function chainBuilder(overrides: { data?: unknown; error?: unknown } = {}) {
  const builder: Record<string, jest.Mock> = {};
  const methods = ['select', 'eq', 'limit', 'single', 'maybeSingle'];
  const terminal = { data: overrides.data ?? null, error: overrides.error ?? null };
  methods.forEach(m => {
    builder[m] = jest.fn().mockReturnValue(
      (m === 'single' || m === 'maybeSingle') ? Promise.resolve(terminal) : builder
    );
  });
  return builder;
}

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`));
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = 'admin@test.com';
  });

  describe('unauthenticated users', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it('should redirect /dashboard to /auth/login', async () => {
      const res = await middleware(createRequest('/dashboard'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
      expect(res.headers.get('location')).toContain('redirect=%2Fdashboard');
    });

    it('should redirect /analytics to /auth/login', async () => {
      const res = await middleware(createRequest('/analytics'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect /settings to /auth/login', async () => {
      const res = await middleware(createRequest('/settings'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect /onboarding to /auth/login', async () => {
      const res = await middleware(createRequest('/onboarding'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect /billing to /auth/login', async () => {
      const res = await middleware(createRequest('/billing'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
    });

    it('should redirect /admin to /auth/login', async () => {
      const res = await middleware(createRequest('/admin'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/auth/login');
    });
  });

  describe('authenticated users without organization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@test.com' } } });
      mockFrom.mockReturnValue(chainBuilder({ data: null })); // no staff record
    });

    it('should redirect /dashboard to /onboarding', async () => {
      const res = await middleware(createRequest('/dashboard'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/onboarding');
    });

    it('should redirect /billing to /onboarding', async () => {
      const res = await middleware(createRequest('/billing'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/onboarding');
    });

    it('should allow access to /onboarding', async () => {
      const res = await middleware(createRequest('/onboarding'));
      expect(res.status).toBe(200);
    });
  });

  describe('authenticated users with organization', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@test.com' } } });
      mockFrom.mockReturnValue(chainBuilder({ data: { id: 'staff-1' } })); // has staff record
    });

    it('should redirect /onboarding to /dashboard when org exists', async () => {
      const res = await middleware(createRequest('/onboarding'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard');
    });

    it('should allow /dashboard when subscription is active', async () => {
      mockRpc.mockResolvedValue({ data: { status: 'active' } });

      const res = await middleware(createRequest('/dashboard'));
      expect(res.status).toBe(200);
    });

    it('should allow /dashboard when subscription is trialing', async () => {
      mockRpc.mockResolvedValue({ data: { status: 'trialing' } });

      const res = await middleware(createRequest('/dashboard'));
      expect(res.status).toBe(200);
    });

    it('should redirect /dashboard to /billing when subscription is expired', async () => {
      mockRpc.mockResolvedValue({ data: { status: 'expired' } });

      const res = await middleware(createRequest('/dashboard'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/billing');
    });

    it('should allow access to /billing even when expired', async () => {
      // billing is not a "protected route" in the subscription check
      const res = await middleware(createRequest('/billing'));
      expect(res.status).toBe(200);
    });
  });

  describe('admin routes', () => {
    it('should allow admin email access to /admin', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@test.com' } } });

      const res = await middleware(createRequest('/admin'));
      expect(res.status).toBe(200);
    });

    it('should redirect non-admin to /dashboard', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@test.com' } } });

      const res = await middleware(createRequest('/admin'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect non-admin from /admin/organizations', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'nonadmin@test.com' } } });

      const res = await middleware(createRequest('/admin/organizations'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard');
    });

    it('should redirect non-admin from /admin/revenue', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@test.com' } } });

      const res = await middleware(createRequest('/admin/revenue'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard');
    });
  });
});
