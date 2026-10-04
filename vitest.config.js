import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "lib/**/*.test.ts"],
    exclude: ["tests/e2e/**", "tests/api-routes.integration.test.ts", "**/node_modules/**"],
    globalSetup: ["tests/globalSetup.ts"],
    fileParallelism: false,
    isolate: false,
  },
});
