# Testing Rules

## Frontend (Vitest + jsdom)
- Test files go in `src/__tests__/` with `.test.tsx` suffix.
- Config: `vitest.config.ts`.
- Use `@testing-library/react` for rendering and `@testing-library/user-event` for interactions.
- Run all: `npm run test:frontend`
- Run single: `npx vitest run src/__tests__/ComponentName.test.tsx`
- Watch mode: `npm run test:watch`

## Mocking auth flow
Tests that render `<App />` (or anything that imports `useAuthStore`) must reset auth state between tests. Pattern:

```ts
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
  });
  localStorage.clear();
});
```

Tests that mount `Login` or anything that triggers `fetchPublicProviders()` should `vi.mock('../api/auth', ...)` and `vi.mock('../api/authClient', ...)` to avoid network calls in jsdom.

## Coverage
- Frontend coverage is reported by `npm run test:coverage` but not gated yet. Add tests as components are touched and ratchet a `--coverage.lines=...` gate up over time.
- The legacy `test:backend` / `test:backend:coverage` scripts were removed in phase 5 — backend lives in the `cuopt-ev-routing-backend` repo with its own pytest suite.

## General
- Tests must be fast and not depend on external services — mock all API calls.
