# Security Rules

## Secrets & Configuration
- Never hardcode secrets, API keys, or backend URLs in source code.
- Runtime config (e.g. `googleMapsApiKey`) is served by `cuopt-ev-routing-backend` at `GET /api/config` and fetched once `appStore.fetchRuntimeConfig()` runs (see `src/store/appStore.ts`). Never commit `.env` files.

## XSS Prevention
- React auto-escapes JSX output. Never use `dangerouslySetInnerHTML` unless content is sanitized.
- Never inject user-supplied data into `href`, `src`, or `style` attributes without validation.

## API Security
- All `/api/*` calls go through `src/api/authClient.ts` (axios with Bearer-token + 401-refresh-retry interceptors). Each domain client (`cuoptClient`, `genaiClient`, `weatherClient`) calls `authClient.get/post('/api/...')` directly — do not construct new axios instances.
- The auth-service endpoints (`/auth/login`, `/auth/refresh`, etc.) bootstrap tokens and use raw axios in `src/api/auth.ts` — never `authClient`, to avoid recursive interceptor loops.
- Tokens live in the persisted Zustand auth store (`cuopt-auth` localStorage key). Do not log them, do not put them in URL query strings, and do not duplicate them into other storage.

## Dependencies
- Run `npm audit --audit-level=high` before any release.
- Run `npm audit fix` for non-breaking patches.

## Content Security
- Never load scripts from untrusted third-party CDNs.
