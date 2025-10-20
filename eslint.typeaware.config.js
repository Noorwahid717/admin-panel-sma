import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import tseslint from "typescript-eslint";

import baseConfig from "./eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json", "apps/*/tsconfig.json"],
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error"
    }
  }
);
