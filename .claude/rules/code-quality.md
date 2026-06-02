# Code Quality Rules

## Completion Checklist
When finishing any new component, hook, util, or file:
1. File has **zero lint errors** (`npm run lint` passes).
2. File has **zero TypeScript errors** (`npm run typecheck` passes).
3. File has **a colocated unit test** in `__tests__/` that passes.
4. File is **under 300 lines**. Split if larger.
5. Barrel file (`index.ts`) is updated to re-export the new module.

## One File, One Responsibility
- One component per `.tsx` file. One hook per `useXxx.ts` file. One util per `.ts` file.
- If a component renders multiple independent sections, extract each into its own sub-component file.
- If a component has complex logic (>20 lines of non-JSX code), extract it into a hook or util.

## Splitting Large Components
When a component exceeds 300 lines or has too many concerns:
1. **Extract sub-components** — independent visual sections become their own files in the same directory.
2. **Extract hooks** — stateful logic, effects, and data fetching move to `src/hooks/useXxx.ts` or a colocated `useXxx.ts`.
3. **Extract utils** — pure functions (formatting, calculations, transformations) move to `src/utils/`.
4. Update imports and barrel files after extraction.

## Style & Formatting
- Follow Prettier config (`.prettierrc`) — formatting is enforced on save.
- Follow ESLint rules (`eslint.config.js`) — fix all errors, minimize warnings.
- Use `@/` alias for imports from `src/`.
- Use `type` keyword for type-only imports (`import type { Foo } from '...'`).
- Blank lines between logical blocks (enforced by `@stylistic/padding-line-between-statements`).

## Best Practices
- Prefer named exports over default exports (except pages).
- Avoid `any` — use proper types or `unknown` with type guards.
- Avoid non-null assertions (`!`) — use optional chaining or type guards.
- No hardcoded strings for API endpoints — use constants or config.
- No `console.log` in production code — remove after debugging.
