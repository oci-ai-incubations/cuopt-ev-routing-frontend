# Testing Rules

## Frontend (Vitest + jsdom)
- Test files go in `src/__tests__/` with `.test.tsx` suffix.
- Config: `vitest.config.ts`.
- Use `@testing-library/react` for rendering and `@testing-library/user-event` for interactions.
- Run all: `npm run test:frontend`
- Run single: `npx vitest run src/__tests__/ComponentName.test.tsx`
- Watch mode: `npm run test:watch`

## Backend (Vitest + supertest)
- Test files go in `server/__tests__/` with `.test.js` suffix.
- Config: `server/vitest.config.js`.
- Use `supertest` to test Express routes; mock `global.fetch` for external calls.
- Run all: `npm run test:backend`
- With coverage: `npm run test:backend:coverage` (80 % gate)

## Coverage
- Backend coverage must stay above 80 % for lines, functions, branches, and statements.
- Frontend coverage is reported but not gated yet — add tests as components are touched.

## General
- Tests must be fast and not depend on external services — mock all API calls.
