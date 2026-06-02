import { describe, expect, it } from 'vitest';

// index.ts is a barrel — verify all three clients are exported and are the
// same singleton instances used by the rest of the application.
import * as apiIndex from '@/api';
import { cuoptClient, genaiClient, weatherClient } from '@/api';

describe('api/index barrel exports', () => {
  it('exports cuoptClient', () => {
    expect(apiIndex.cuoptClient).toBeDefined();
  });

  it('exports genaiClient', () => {
    expect(apiIndex.genaiClient).toBeDefined();
  });

  it('exports weatherClient', () => {
    expect(apiIndex.weatherClient).toBeDefined();
  });

  it('re-exports the same cuoptClient singleton', () => {
    expect(apiIndex.cuoptClient).toBe(cuoptClient);
  });

  it('re-exports the same genaiClient singleton', () => {
    expect(apiIndex.genaiClient).toBe(genaiClient);
  });

  it('re-exports the same weatherClient singleton', () => {
    expect(apiIndex.weatherClient).toBe(weatherClient);
  });
});
