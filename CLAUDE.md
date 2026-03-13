# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Frontend for the cuOpt accelerator pack: **EV Routing**.

Tech stack: React 18, Vite, MUI 5 (Oracle dark theme), Vitest + Testing Library.

## Commands

```bash
npm install           # install dependencies
npm run dev           # start dev server on :3000 (proxies /api → :8000)
npm test              # run Vitest (once)
npm run test:watch    # run Vitest in watch mode
npm run build         # production build
npm audit             # dependency security scan
```

## Pre-commit Hook

Enable once per clone to run lint + tests + audit before every commit:

```bash
git config core.hooksPath .githooks
```

## Before Every Push

Run manually if the hook is not enabled:

1. `npm run build` — lint check via Vite
2. `npm test` — unit tests (must pass)
3. `npx vitest run --coverage --coverage.provider=v8 --coverage.lines=80 --coverage.functions=80 --coverage.branches=80` — coverage ≥ 80%
4. `npm audit --audit-level=high` — no high-severity vulnerabilities

## Architecture

- `src/index.jsx` — MUI ThemeProvider with Oracle dark theme
- `src/index.css` — Oracle CSS design tokens
- `src/App.jsx` — Root application component
- `src/components/` — UI components (Header + feature components)
- `src/services/api.js` — Axios API client (all backend calls go through here)
- `src/__tests__/` — Vitest tests (one file per component)

## Rules

- `.claude/rules/frontend.md` — React/MUI/Oracle theme conventions
- `.claude/rules/testing.md` — Vitest + Testing Library guidelines
- `.claude/rules/security.md` — Frontend security requirements
- `.claude/rules/ci-checks.md` — Pre-push CI workflow

## Skills

- `/lint` — vite build + npm audit
- `/test-frontend` — run Vitest
- `/coverage` — run coverage, fail below 80%
- `/security-scan` — npm audit + secrets check
- `/github` — PR workflow: push, open PR, monitor CI, request review
