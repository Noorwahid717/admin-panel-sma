import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "apps/shared/dist"),
      "@api": resolve(__dirname, "apps/api/src"),
    },
  },
  test: {
    include: ["apps/api/**/*.spec.ts"],
    environment: "node",
    setupFiles: ["apps/api/test/setup.ts"],
  },
});
