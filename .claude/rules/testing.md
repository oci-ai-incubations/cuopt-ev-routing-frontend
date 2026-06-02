# Testing Rules

## Mandatory Coverage
- **Every new component, hook, or util MUST have a unit test file** created alongside it.
- Write tests immediately after creating the source file — do not defer.
- Run the test (`npx vitest run <test-file>`) and confirm it passes before considering the task done.

## Test File Placement
- Tests are colocated with their source in a `__tests__/` directory:
  - `src/components/Foo/Bar.tsx` → `src/components/Foo/__tests__/Bar.test.tsx`
  - `src/hooks/useFoo.ts` → `src/hooks/__tests__/useFoo.test.ts`
  - `src/utils/foo.ts` → `src/utils/__tests__/foo.test.ts`
  - `src/api/foo.ts` → `src/api/__tests__/foo.test.ts`
  - `src/pages/Foo.tsx` → `src/pages/__tests__/Foo.test.tsx`
  - `src/store/fooStore.ts` → `src/store/__tests__/fooStore.test.tsx`
- Config: `vitest.config.ts`.
- Use `@testing-library/react` for rendering and `@testing-library/user-event` for interactions.

## Run Commands
- Run all: `npm run test:frontend`
- Run single: `npx vitest run <test-file>`
- Watch mode: `npm run test:watch`

## Mocking auth flow
Tests that render `<App />` (or anything that imports `useAuthStore`) must reset auth state between tests:

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

## Test Quality
- Test behavior, not implementation details.
- Each test should assert one logical thing (use descriptive `it('should ...')` names).
- Mock all external API calls — tests must not depend on external services.
- Tests must be fast (<5s per file).

## Coverage
- Frontend coverage: `npm run test:coverage`.
- Add tests for every new or modified file; ratchet coverage gate up over time.
