# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cuOPT EV Routing Frontend** — production-ready Vehicle Routing Problem (VRP) UI for the cuopt accelerator pack. Combines NVIDIA cuOPT GPU-accelerated optimization with OCI Generative AI for explanations, real-time weather integration, and map visualization. Targets logistics / field-service / mobile-workforce use cases.

The frontend is a **static SPA only**. All backend API logic lives in:
- `cuopt-ev-routing-backend` (FastAPI, sibling repo) — serves `/api/*` (cuopt + genai + weather + config). All `/api/*` is auth-protected (HS256 JWT).
- `accelerator-pack-auth-service` (sibling repo) — serves `/auth/*` (login, refresh, SSO, /me).

The legacy Express server that lived in `server/` was retired in phase 5 of the auth-integration epic; FastAPI absorbed it.

## Tech Stack

- React 18.2, **TypeScript** strict, Vite 5.4
- Tailwind 3.4 + lucide-react icons
- Zustand stores, Tanstack Query for server state
- react-router-dom 6 routing (BrowserRouter + ProtectedRoute / LoginGuard)
- axios for HTTP (single auth-aware instance — see `src/api/authClient.ts`)
- ESLint flat config, Vitest + @testing-library, husky for pre-commit
- Production: nginx serving `dist/` (`appdeploy/Dockerfile` + `appdeploy/nginx.conf`). The OKE ingress (configured in `ai-accelerator-starter-packs` blueprint_files.tf) routes `/api/*` and `/auth/*` to upstream pods directly.

## Commands

```bash
npm install                 # install deps
npm run dev                 # vite dev server on :5173
npm run build               # tsc + vite build → dist/
npm run preview             # preview production build locally
npm run lint                # eslint .
npm run lint:fix            # eslint . --fix
npm test                    # vitest (one-shot)
npm run test:watch          # vitest watch
npm run test:coverage       # vitest with coverage report
npm audit --audit-level=high
npm run ci                  # lint + test:frontend + audit (local CI bundle)
```

## Local development

This repo's dev server expects two sibling services running locally:
- `accelerator-pack-auth-service` on **port 8080**
- `cuopt-ev-routing-backend` on **port 8081** (override its default 8080 to avoid clashing with auth-service — e.g. `uvicorn cuopt_ev_routing_backend.main:app --reload --port 8081`)

Vite proxies `/auth` → `VITE_AUTH_HOST` (default `http://localhost:8080`) and `/api` → `VITE_CUOPT_BACKEND_URL` (default `http://localhost:8081`).

The cuopt backend defaults to `CUOPT_AUTH_REQUIRE_AUTH=false` for local dev, which returns a synthetic admin user on every `/api/*` request — log in via the Login page anyway to exercise the full flow, or hit `/api/*` directly without auth headers.

## Architecture

```
src/
├── main.tsx                  # entrypoint, mounts QueryClientProvider + App
├── App.tsx                   # BrowserRouter + Routes (login / callback / app / admin)
├── index.css                 # Tailwind + design tokens
├── api/
│   ├── authClient.ts         # axios with Bearer + 401-refresh-retry interceptors
│   ├── auth.ts               # /auth/* typed wrappers
│   ├── cuoptClient.ts        # cuopt VRP solve flow (uses authClient)
│   ├── genaiClient.ts        # OCI Generative AI gateway calls (uses authClient)
│   ├── weatherClient.ts      # weather + adverse-conditions assessment (uses authClient)
│   └── index.ts
├── pages/                    # routed pages
│   ├── Login.tsx
│   └── SSOCallback.tsx
├── components/
│   ├── ProtectedRoute.tsx    # auth + optional role gate
│   ├── LoginGuard.tsx        # bounce authenticated users from /login
│   ├── Layout/               # header, sidebar, modals
│   ├── Admin/                # admin panel components
│   ├── Chat/, Dashboard/, Map/, Metrics/, Weather/, shared/
├── store/                    # Zustand stores (auth, app, config, optimization, weather, chat)
├── types/                    # TS types
├── utils/, data/             # helpers + demo data
└── __tests__/                # vitest tests

appdeploy/                    # deployment manifests (Dockerfile, nginx.conf, k8s/)
demo/                         # demo content
docs/                         # public docs
public/, index.html
vite.config.ts, vitest.config.ts, eslint.config.js, tailwind.config.js, postcss.config.js
tsconfig.json, tsconfig.node.json
```

## Current feature

**Auth integration** — phase 5 complete. `feature/integrate-auth-service`.

Phases (per the parent repo's `CLAUDE.md`):
1. ✅ TF: deploy auth-service + cuopt-backend + ingress (in `ai-accelerator-starter-packs`)
2. ✅ BE port: Express → FastAPI + HS256 JWT dep (in `cuopt-ev-routing-backend`)
3. ✅ FE state/HTTP: `authStore`, `authClient`, `auth.ts`, `types/auth.ts`
4. ✅ FE UI components: `Login`, `SSOCallback`, `ProtectedRoute`, `LoginGuard`
5. ✅ App.tsx router refactor + client migrations + retire Express
6. (next) Admin panels (User + Roles + Groups + IDPs + Collection perms + Audit log)
7. (next) Vite proxy already in place; production proxy lives in OKE ingress

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
