import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';

// Suppress React Router v6→v7 future-flag noise in test output.
// These warnings are expected until we upgrade; they are not test failures.
const originalWarn = console.warn.bind(console);

beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation((msg: unknown, ...rest: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('React Router Future Flag Warning')) return;
    originalWarn(msg, ...rest);
  });
});
afterAll(() => {
  vi.mocked(console.warn).mockRestore();
});
