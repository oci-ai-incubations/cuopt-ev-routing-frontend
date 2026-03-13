# Frontend Rules

## Tech Stack
- React 18, Vite, MUI 5, Vitest + Testing Library.
- JavaScript (JSX), not TypeScript.

## Oracle Dark Theme
- The MUI theme in `src/index.jsx` and CSS variables in `src/index.css` define the Oracle dark theme. Keep them in sync.
- Primary color: `#C74634` (Oracle red). Backgrounds: `#191919`, `#312D2A`, `#3A3633`, `#423E3B`.
- Use CSS variables (e.g. `var(--oracle-red)`, `var(--bg-secondary)`) for inline styles.
- Use MUI `sx` prop for layout and spacing. Reference CSS variables for colors.
- New components must follow the same patterns as `Header`.

## Component Conventions
- Components go in `src/components/`. One component per file.
- Include JSDoc comments on component functions documenting props.
- Use MUI components (Paper, Box, Typography, Button, etc.) as building blocks.

## API Client
- All backend calls go through `src/services/api.js` using axios with `baseURL: '/api'`.
- Vite dev server proxies `/api` to the backend — do not hardcode backend URLs in components.
- Add new API functions to `api.js` rather than making ad-hoc axios calls in components.
