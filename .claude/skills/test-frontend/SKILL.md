---
name: test-frontend
description: Run Vitest unit tests.
user-invocable: true
allowed-tools: Bash, Read, Grep
argument-hint: [test-file]
---

# Test Frontend

## Arguments

- `<test-file>` (optional) — Specific test file, e.g. `src/__tests__/App.test.tsx`

## Commands

If a test file is provided:
```bash
npx vitest run <test-file>
```

Otherwise run all frontend tests:
```bash
npm run test:frontend
```

For backend tests:
```bash
npm run test:backend
```

## On Failure

Show the failing test name, error, and the component it tests. Suggest a fix.
