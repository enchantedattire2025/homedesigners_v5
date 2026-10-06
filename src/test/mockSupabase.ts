import { vi } from 'vitest';

export interface MockQueryChain {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
}

export function createMockQueryChain(resolvedData: unknown = [], error: unknown = null): MockQueryChain {
  const chain: any = {};

  const resolve = () => Promise.resolve({ data: resolvedData, error });

  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);

  chain.eq = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.like = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.overlaps = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);

  chain.single = vi.fn(() => Promise.resolve({ data: Array.isArray(resolvedData) ? resolvedData[0] ?? null : resolvedData, error }));
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: Array.isArray(resolvedData) ? resolvedData[0] ?? null : resolvedData, error }));

  // Make the chain itself thenable (resolves as { data, error })
  chain.then = vi.fn((onFulfilled: (val: unknown) => unknown) => Promise.resolve(resolve()).then(onFulfilled));

  // Also support .then on the result of .single/.maybeSingle
  // (already returns a Promise, so no extra work needed)

  return chain;
}

export function createMockSupabase(options: {
  data?: unknown;
  error?: unknown;
  sessionData?: unknown;
  user?: unknown;
  signUpError?: unknown;
  signInError?: unknown;
} = {}) {
  const {
    data = [],
    error = null,
    sessionData = null,
    user = null,
    signUpError = null,
    signInError = null,
  } = options;

  const queryChain = createMockQueryChain(data, error);

  const mock = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: sessionData }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user }, error: null })),
      signUp: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: signUpError,
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: signInError,
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => queryChain),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  };

  return mock;
}

// Helper to mock the supabase module
export function mockSupabaseModule(options?: Parameters<typeof createMockSupabase>[0]) {
  const mock = createMockSupabase(options);

  vi.mock('../lib/supabase', () => ({
    supabase: mock,
    // Also export types for components that import them
  }));

  return mock;
}
