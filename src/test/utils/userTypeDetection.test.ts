import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectUserTypeAndRedirect, isUserAuthenticated } from '../../utils/userTypeDetection';

// Mutable state for controlling mock responses
let mockSession: any = null;
let mockAdminData: any = null;
let mockDesignerData: any = null;
let mockCustomerData: any = null;
let mockSessionError: any = null;
let fromCallCount = 0;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: mockSessionError })),
    },
    from: vi.fn(() => {
      fromCallCount++;
      const isAdminCall = fromCallCount === 1;
      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        limit: vi.fn(() => Promise.resolve({ data: mockCustomerData, error: null })),
        maybeSingle: vi.fn(() =>
          Promise.resolve({
            data: isAdminCall ? mockAdminData : mockDesignerData,
            error: null,
          })
        ),
      };
      return chain;
    }),
  },
}));

beforeEach(() => {
  mockSession = null;
  mockAdminData = null;
  mockDesignerData = null;
  mockCustomerData = null;
  mockSessionError = null;
  fromCallCount = 0;
  vi.clearAllMocks();
});

describe('detectUserTypeAndRedirect', () => {
  it('returns null when no session exists', async () => {
    const result = await detectUserTypeAndRedirect();
    expect(result).toBeNull();
  });

  it('detects admin user and returns admin redirect path', async () => {
    mockSession = { user: { id: 'user-admin' } };
    mockAdminData = { id: 'admin-1', role: 'admin', is_active: true };

    const result = await detectUserTypeAndRedirect();
    expect(result).not.toBeNull();
    expect(result!.userType).toBe('admin');
    expect(result!.redirectPath).toBe('/admin');
  });

  it('detects designer user and returns designer redirect path', async () => {
    mockSession = { user: { id: 'user-designer' } };
    mockAdminData = null;
    mockDesignerData = { id: 'designer-1', name: 'Test', is_active: true };

    const result = await detectUserTypeAndRedirect();
    expect(result).not.toBeNull();
    expect(result!.userType).toBe('designer');
    expect(result!.redirectPath).toBe('/designer-dashboard');
  });

  it('detects customer user and returns customer redirect path', async () => {
    mockSession = { user: { id: 'user-customer' } };
    mockAdminData = null;
    mockDesignerData = null;
    mockCustomerData = [{ id: 'cust-1' }];

    const result = await detectUserTypeAndRedirect();
    expect(result).not.toBeNull();
    expect(result!.userType).toBe('customer');
    expect(result!.redirectPath).toBe('/my-projects');
  });

  it('returns none type when user has no registration', async () => {
    mockSession = { user: { id: 'user-unknown' } };
    mockAdminData = null;
    mockDesignerData = null;
    mockCustomerData = [];

    const result = await detectUserTypeAndRedirect();
    expect(result).not.toBeNull();
    expect(result!.userType).toBe('none');
    expect(result!.redirectPath).toBe('/');
  });

  it('returns null on session error', async () => {
    mockSessionError = { message: 'Session error' };

    const result = await detectUserTypeAndRedirect();
    expect(result).toBeNull();
  });
});

describe('isUserAuthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when session has a user', async () => {
    mockSession = { user: { id: '123' } };

    const result = await isUserAuthenticated();
    expect(result).toBe(true);
  });

  it('returns false when no session', async () => {
    mockSession = null;

    const result = await isUserAuthenticated();
    expect(result).toBe(false);
  });
});
