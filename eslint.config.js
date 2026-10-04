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
    files: ["scripts/**", "src/**", "db/**"],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        console: "readonly",
      },
    },
  },
];
