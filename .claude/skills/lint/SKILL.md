---
name: lint
description: Run lint and build check (vite build) and npm audit for the frontend.
user-invocable: true
allowed-tools: Bash, Read
---

# Lint

## Commands

```bash
npm run lint
npm run build
npm run audit:security
```

## On Failure

- **ESLint error**: Show the error, investigate the referenced file, fix and rerun.
- **TypeScript / vite build error**: Show the error, investigate the referenced file, fix and rerun.
- **npm audit**: Show vulnerability details, suggest `npm audit fix` or manual upgrades.
