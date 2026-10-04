import js from "@eslint/js";

export default [
  { ignores: ["dist/**", "node_modules/**", "openspec/**", ".claude/**", ".next/**", "build/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  {
    files: ["app/**", "components/**", "features/**", "lib/**"],
    languageOptions: {
      globals: {
        React: "readonly",
      },
    },
  },
  {
    files: ["scripts/**", "vitest.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        fetch: "readonly",
        console: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    files: ["tests/**"],
    languageOptions: {
      globals: {
        process: "readonly",
        fetch: "readonly",
        console: "readonly",
      },
    },
  },
];
