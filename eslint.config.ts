// eslint.config.js
import tseslint from "typescript-eslint";
import js from "@eslint/js";
import globals from "globals";
import path from "path";

export default [
  js.configs.recommended,

  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**/*",
      "node_modules/**/*",
      "src/__tests__/**/*",
      "jest.config.js",
      "/coverage/",
      "generated",
    ],
  },

  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.node,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve("./tsconfig.json"),
        },
      },
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "n/no-missing-import": "off",
    },
  },
];
