# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cuOPT EV Routing Frontend** — production-ready Vehicle Routing Problem (VRP) UI for the cuopt accelerator pack. Combines NVIDIA cuOPT GPU-accelerated optimization with OCI Generative AI for explanations, real-time weather integration, and map visualization. Targets logistics / field-service / mobile-workforce use cases.

The frontend talks to:
- The cuopt EV routing backend (FastAPI, separate repo `cuopt-ev-routing-backend`) over `/api/*`
- Optionally the LLM gateway (OCI Generative AI) for natural-language route explanations
- A weather provider for weather-aware constraints

## Tech Stack

- React 18.2, **TypeScript** strict, Vite 5.4
- Tailwind 3.4 + lucide-react icons
- Zustand stores, Tanstack Query for server state
- react-router-dom 6 for routing
- axios for HTTP, leaflet + @react-google-maps/api for maps, recharts for charts
- ESLint flat config (`eslint.config.js`), Vitest + @testing-library, husky for pre-commit
- Production: Express static server (`server/index.js`) serving `dist/`

## Commands

```bash
npm install                 # install deps (uses package-lock.json)
npm run dev                 # vite dev server on :3000
npm run server              # Express static server (after build)
npm start                   # both, concurrently
npm run build               # tsc + vite build → dist/
npm run lint                # eslint .
npm run lint:fix            # eslint . --fix
npm test                    # vitest (one-shot)
npm run test:watch          # vitest watch
npm run test:coverage       # vitest with coverage report (FE)
npm run test:backend:coverage  # 80% coverage gate on the Express server tests
npm audit --audit-level=high
npm run ci                  # lint + test:frontend + test:backend:coverage + audit (the local CI bundle)
```

## Architecture

```
src/
├── main.tsx                  # entrypoint
├── App.tsx                   # router root
├── index.css                 # Tailwind + design tokens
├── api/
│   ├── cuoptClient.ts        # cuopt-ev-routing-backend calls
│   ├── genaiClient.ts        # OCI Generative AI gateway
│   ├── weatherClient.ts      # weather provider
│   └── index.ts
├── store/                    # Zustand stores
│   ├── optimizationStore.ts
│   ├── weatherStore.ts
│   ├── appStore.ts
│   ├── configStore.ts
│   └── index.ts
├── types/                    # TS types (cuopt, weather, genai)
├── utils/
├── data/                     # demo data (UK postcodes, sample stops)
└── __tests__/                # vitest tests

server/                       # Express static server for production
appdeploy/                    # deployment manifests
demo/                         # demo content
docs/                         # public docs
public/, index.html
vite.config.ts, vitest.config.ts, eslint.config.js, tailwind.config.js, postcss.config.js
tsconfig.json, tsconfig.node.json
```

## Current Feature

**Auth integration** — wiring `accelerator-pack-auth-service` (per-user JWT auth) into cuopt. Branch: `feature/integrate-auth-service`. Frontend changes to land here:

- `src/api/authClient.ts` — axios instance with Bearer-token interceptor + 401-refresh-retry
- `src/api/auth.ts` — auth-service endpoints (login, refresh, /auth/me, SSO)
- `src/store/authStore.ts` — auth state (Zustand, persist)
- `src/pages/Login.tsx`, `src/pages/SSOCallback.tsx` — login UI
- `<ProtectedRoute>` / `<LoginGuard>` — route guards integrated into App.tsx routing
- Existing `cuoptClient`, `genaiClient`, `weatherClient` migrated to use `authClient` so all backend calls carry the Bearer token

The companion `cuopt-ev-routing-backend` repo (FastAPI/Python 3.12) gets HS256 JWT validation via a FastAPI `Depends`, sharing `AUTH_JWT_SECRET` with the auth service.

## Skills

- `/lint` — `npm run lint` + `npm audit`
- `/test-frontend` — vitest, optionally with a single-file argument
- `/security-scan` — npm audit + secrets scan
- `/github` — PR workflow: open, check, monitor CI, request review

## Rules

- `.claude/rules/frontend.md` — React / TS / Vite / Tailwind / Zustand / Tanstack conventions
- `.claude/rules/testing.md` — Vitest + Testing Library guidelines
- `.claude/rules/security.md` — Frontend security requirements
- `.claude/rules/ci-checks.md` — Pre-push CI workflow

## Parent repo

This submodule lives inside `accelerator-packs-auth-integration`. Submodule changes follow the two-step commit pattern — see the parent's `CLAUDE.md`.
