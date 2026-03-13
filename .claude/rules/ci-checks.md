# CI Checks — Pre-push Workflow

Before every `git push`, run all checks. Each check is a separate Bash call.

## Frontend checks (from repo root)

1. `npm run build` — verify no build/lint errors
2. `npm test` — all unit tests must pass
3. `npx vitest run --coverage --coverage.provider=v8 --coverage.lines=80 --coverage.functions=80 --coverage.branches=80` — coverage ≥ 80%
4. `npm audit --audit-level=high` — no high-severity vulnerabilities

Fix any failures before pushing. CI runs the same checks.
