import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.integration.test.ts", "!tests/api-routes.integration.test.ts"],
    fileParallelism: false,
    isolate: false,
  },
});
