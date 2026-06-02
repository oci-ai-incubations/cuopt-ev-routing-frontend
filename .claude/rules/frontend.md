# Frontend Rules

## Tech Stack
- React 18, Vite, TypeScript, Tailwind CSS, Zustand, Vitest + Testing Library.

## Theme
- CSS variables in `src/index.css` define the dark theme.
- Use Tailwind utility classes or CSS variables (e.g. `var(--oracle-red)`, `var(--bg-secondary)`) for styles.

## Component Conventions
- Components go in `src/components/`. **One component per file — no exceptions.**
- Use the `@/` path alias for imports from `src/`.
- Shared/reusable components live in `src/components/shared/`.
- Pages go in `src/pages/`, hooks in `src/hooks/`, utils in `src/utils/`, types in `src/types/`.

## File Size Limits
- **Max 300 lines per file.** If a component grows beyond this, split it:
  - Extract sub-components into separate files in the same directory.
  - Extract logic into custom hooks (`src/hooks/` or colocated `useXxx.ts`).
  - Extract pure helper functions into `src/utils/`.
- After splitting, update barrel files (`index.ts`) to re-export new modules.

## Component Structure
- Large components must be broken into small, focused sub-components.
- Each sub-component should have a single responsibility.
- Business logic, data transformations, and side effects go into hooks or utils — not inline in JSX.
- Prefer composition over conditional rendering with many branches.

## API Client
- All backend calls go through `src/api/` client modules.
- Vite dev server proxies `/api` to the backend — do not hardcode backend URLs in components.
