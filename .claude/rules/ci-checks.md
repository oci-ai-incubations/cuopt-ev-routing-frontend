# CI Checks — Pre-push Workflow

Before every `git push`, run all checks. Each check is a separate Bash call.

## Frontend checks (from repo root)

1. `npm run lint` — ESLint (must have 0 errors; warnings are OK)
2. `npm run build` — TypeScript + Vite build check
3. `npm run test:frontend` — frontend unit tests must pass
4. `npm run test:coverage` — frontend coverage report (informational)

## Security

5. `npm run audit:security` — no high-severity npm vulnerabilities

## Quick alias

`npm run ci` runs lint → frontend tests → audit sequentially.

The legacy `test:backend` / `test:backend:coverage` jobs were removed in phase 5 of the auth-integration epic — backend logic now lives in the `cuopt-ev-routing-backend` repo (FastAPI) with its own pytest CI.

Fix any failures before pushing. GitHub Actions CI runs the same checks.
