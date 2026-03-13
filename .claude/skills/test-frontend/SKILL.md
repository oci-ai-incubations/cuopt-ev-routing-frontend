---
name: test-frontend
description: Run Vitest unit tests.
user-invocable: true
allowed-tools: Bash, Read, Grep
argument-hint: [test-file]
---

# Test Frontend

## Arguments

- `` (optional) — Specific test file, e.g. `src/__tests__/Header.test.jsx`

## Commands

If a test file is provided:
```bash
npx vitest run
```

Otherwise:
```bash
npm test
```

## On Failure

Show the failing test name, error, and the component it tests. Suggest a fix.
