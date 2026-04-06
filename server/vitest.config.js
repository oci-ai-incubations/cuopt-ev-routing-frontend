import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.js"],
      exclude: ["server/**/*.test.js", "server/index.js", "server/vitest.config.js"],
    },
  },
});
