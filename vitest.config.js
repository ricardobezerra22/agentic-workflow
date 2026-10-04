import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.js", "src/**/*.integration.test.js", "tests/**/*.e2e.test.js"],
  },
});
