import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  // ── Global ignores ────────────────────────────────────────────────────────
  { ignores: ["dist/", "node_modules/", "coverage/", "appdeploy/"] },

  // ── Frontend: src/ ────────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
        node: true,
      },
      "import/internal-regex": "^@/",
    },
    rules: {
      // ── ESLint base ────────────────────────────────────────────────────
      ...js.configs.recommended.rules,
      "no-undef": "off",        // TypeScript covers this
      "no-unused-vars": "off",  // replaced by @typescript-eslint/no-unused-vars
      "no-redeclare": "off",    // replaced by @typescript-eslint/no-redeclare

      // variables & declarations
      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",

      // equality
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "yoda": "warn",

      // control flow
      "curly": ["warn", "multi-line"],
      "no-else-return": ["warn", { allowElseIf: false }],
      "no-lonely-if": "warn",
      "no-useless-return": "warn",
      "no-throw-literal": "error",

      // modern syntax
      "prefer-template": "warn",
      "prefer-arrow-callback": "warn",
      "prefer-rest-params": "error",
      "prefer-spread": "warn",
      "object-shorthand": "warn",
      "dot-notation": "warn",
      "no-useless-concat": "warn",
      "no-useless-rename": "warn",

      // readability
      "no-nested-ternary": "warn",
      "spaced-comment": ["warn", "always", { markers: ["/"] }],
      "no-console": "warn",

      // ── TypeScript ─────────────────────────────────────────────────────
      ...tseslint.plugin.configs["recommended"].rules,
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",

      // type imports
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // type definitions
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],

      // modern TS syntax
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",

      // ── React ──────────────────────────────────────────────────────────
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "warn",
      "react/self-closing-comp": "warn",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-useless-fragment": "warn",
      "react/no-array-index-key": "warn",

      // JSX style
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],

      // ── React Hooks ────────────────────────────────────────────────────
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ── Imports / aliases ──────────────────────────────────────────────
      "import/no-duplicates": "error",
      "import/no-cycle": "warn",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": "warn",
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",  // @/ aliases
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // ── Backend: server/ ──────────────────────────────────────────────────────
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-console": "off",
    },
  },

  // ── Test files ────────────────────────────────────────────────────────────
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "**/setupTests.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ── Config files ──────────────────────────────────────────────────────────
  {
    files: ["*.config.{js,ts}", "postcss.config.js", "tailwind.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-var": "error",
    },
  },
];
