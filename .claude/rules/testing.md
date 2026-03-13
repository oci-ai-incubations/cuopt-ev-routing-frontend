# Testing Rules

## Vitest
- Test files go in `src/__tests__/` with `.test.jsx` suffix.
- Use `@testing-library/react` for rendering and `@testing-library/user-event` for interactions.
- Wrap components needing MUI theme in a `<ThemeProvider>` in tests.
- Run all: `npm test`
- Run single: `npx vitest run src/__tests__/ComponentName.test.jsx`
- Watch mode: `npm run test:watch`

## Coverage
- Every new component or feature must be accompanied by unit tests.
- Coverage must stay above 80% for lines, functions, branches, and statements.
- Run: `npx vitest run --coverage --coverage.provider=v8 --coverage.lines=80 --coverage.functions=80 --coverage.branches=80 --coverage.statements=80`

## General
- Tests must be fast and not depend on external services — mock all API calls.
- Use `vi.mock('../services/api', ...)` to stub API functions.
