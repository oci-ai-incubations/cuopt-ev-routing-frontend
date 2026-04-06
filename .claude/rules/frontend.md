# Frontend Rules

## Tech Stack
- React 18, Vite, TypeScript, Tailwind CSS, Zustand, Vitest + Testing Library.

## Theme
- CSS variables in `src/index.css` define the dark theme.
- Use Tailwind utility classes or CSS variables (e.g. `var(--oracle-red)`, `var(--bg-secondary)`) for styles.

## Component Conventions
- Components go in `src/components/`. One component per file.
- Use the `@/` path alias for imports from `src/`.
- Shared/reusable components live in `src/components/shared/`.

## API Client
- All backend calls go through `src/api/` client modules.
- Vite dev server proxies `/api` to the backend — do not hardcode backend URLs in components.
