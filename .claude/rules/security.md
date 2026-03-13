# Frontend Security Rules

## Secrets & Configuration
- Never hardcode secrets, API keys, or backend URLs in source code.
- Runtime config is injected via `public/env-config.js` → `window.__ENV__`. Never commit `.env` files.

## XSS Prevention
- React auto-escapes JSX output. Never use `dangerouslySetInnerHTML` unless content is sanitized.
- Never inject user-supplied data into `href`, `src`, or `style` attributes without validation.

## API Security
- All API calls go through `src/services/api.js` via the Vite proxy — never hardcode backend URLs.
- Do not store sensitive data in `localStorage` or `sessionStorage`.

## Dependencies
- Run `npm audit --audit-level=high` before any release.
- Run `npm audit fix` for non-breaking patches.

## Content Security
- Never load scripts from untrusted third-party CDNs.
