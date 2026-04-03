# CI Checks — Pre-push Workflow

Before every `git push`, run all checks. Each check is a separate Bash call.

## Frontend checks (from repo root)

1. `npm run lint` — ESLint (must have 0 errors; warnings are OK)
2. `npm run build` — TypeScript + Vite build check
3. `npm run test:frontend` — frontend unit tests must pass
4. `npm run test:coverage` — frontend coverage report (informational)

## Backend checks

5. `npm run test:backend:coverage` — backend tests with 80 % coverage gate (lines, functions, branches, statements)

## Security

6. `npm run audit:security` — no high-severity npm vulnerabilities

## Quick alias

`npm run ci` runs lint → frontend tests → backend tests (with coverage) → audit sequentially.

Fix any failures before pushing. GitHub Actions CI runs the same checks.
