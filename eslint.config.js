import js from "@eslint/js";

export default [
  { ignores: ["dist/**", "node_modules/**", "openspec/**", ".claude/**"] },
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
    files: ["scripts/**"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];
