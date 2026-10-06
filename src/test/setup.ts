import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Suppress console.log/console.error noise during tests unless explicitly checking
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args: unknown[]) => {
  if (process.env.VITEST_VERBOSE) originalLog(...args);
};
console.error = (...args: unknown[]) => {
  if (process.env.VITEST_VERBOSE) originalError(...args);
};
console.warn = (...args: unknown[]) => {
  if (process.env.VITEST_VERBOSE) originalWarn(...args);
};

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  localStorage.clear();
  sessionStorage.clear();
});

// Mock window.matchMedia (used by some components)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock IntersectionObserver (used by lazy-loaded components)
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}

if (!window.IntersectionObserver) {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}
