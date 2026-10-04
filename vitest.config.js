import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(import.meta.dirname, ".") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/**/*.unit.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["tests/setup.unit.ts"],
          sequence: { groupOrder: 1 },
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/**/*.integration.test.ts", "!tests/api-routes.integration.test.ts"],
          fileParallelism: false,
          isolate: false,
          sequence: { groupOrder: 2 },
        },
      },
    ],
  },
});
