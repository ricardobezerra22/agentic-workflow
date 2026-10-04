import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["src/**/*.test.{js,ts}", "src/**/*.integration.test.{js,ts}", "tests/**/*.integration.test.js", "tests/**/*.e2e.test.js"],
    threads: false,
    isolate: false,
  },
});
