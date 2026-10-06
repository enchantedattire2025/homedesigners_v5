import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuthContext } from '../../hooks/AuthContext';
import type { User } from '@supabase/supabase-js';

// Mutable mock state
let mockSession: any = null;
let mockAdminData: any = null;
let mockDesignerData: any = null;
let mockAuthCallback: ((event: string, session: any) => void) | null = null;

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession }, error: null })),
      onAuthStateChange: vi.fn((cb: (event: string, session: any) => void) => {
        mockAuthCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => {
      // Each from() call returns a fresh chain.
      // AuthContext calls from() twice: once for admin_users, once for designers.
      // We use a module-level call counter to alternate which data to return.
      fromCallCount++;
      const isAdminCall = fromCallCount % 2 === 1;

      const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
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

let fromCallCount = 0;

import { supabase as mockSupabase } from '../../lib/supabase';

const mockUser: User = {
  id: 'test-user-id',
  aud: 'authenticated',
  created_at: '2024-01-01',
  app_metadata: {},
  user_metadata: {},
} as unknown as User;

beforeEach(() => {
  mockSession = null;
  mockAdminData = null;
  mockDesignerData = null;
  mockAuthCallback = null;
  fromCallCount = 0;
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  describe('useAuthContext', () => {
    it('throws when used outside AuthProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuthContext())).toThrow(
        'useAuthContext must be used within AuthProvider'
      );
      spy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('starts with loading=true and no user', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDesigner).toBe(false);
    });

    it('sets loading=false after getSession resolves with no session', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDesigner).toBe(false);
    });
  });

  describe('authenticated state', () => {
    it('sets user and detects admin role', async () => {
      mockSession = { user: mockUser };
      mockAdminData = { id: 'admin-1', is_active: true };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      expect(result.current.isDesigner).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('sets user and detects designer role', async () => {
      mockSession = { user: mockUser };
      mockAdminData = null;
      mockDesignerData = { id: 'designer-1', is_active: true };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await waitFor(() => {
        expect(result.current.isDesigner).toBe(true);
      });

      expect(result.current.isAdmin).toBe(false);
    });

    it('sets neither admin nor designer when user has no roles', async () => {
      mockSession = { user: mockUser };
      mockAdminData = null;
      mockDesignerData = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDesigner).toBe(false);
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut and clears localStorage', async () => {
      mockSession = { user: mockUser };
      mockAdminData = null;
      mockDesignerData = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      localStorage.setItem('sb-test-key', 'test-value');
      localStorage.setItem('other-key', 'other-value');

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(localStorage.getItem('sb-test-key')).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('sets loading=false for same user ID (deduplication)', async () => {
      mockSession = { user: mockUser };
      mockAdminData = null;
      mockDesignerData = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        if (mockAuthCallback) {
          mockAuthCallback('TOKEN_REFRESHED', { user: mockUser });
        }
      });

      expect(result.current.loading).toBe(false);
    });

    it('updates user when auth state changes with a new user', async () => {
      mockSession = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newUser = { ...mockUser, id: 'new-user-id' } as unknown as User;

      act(() => {
        if (mockAuthCallback) {
          mockAuthCallback('SIGNED_IN', { user: newUser });
        }
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
      });
    });

    it('clears roles when user signs out via auth state change', async () => {
      mockSession = { user: mockUser };
      mockAdminData = { id: 'admin-1', is_active: true };
      mockDesignerData = null;

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuthContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });

      act(() => {
        if (mockAuthCallback) {
          mockAuthCallback('SIGNED_OUT', { user: null });
        }
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDesigner).toBe(false);
    });
  });
});
