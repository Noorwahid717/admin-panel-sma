import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [tsconfigPaths({ projects: [resolve(__dirname, "tsconfig.json")] })],
  resolve: {
    alias: {
      "@api": resolve(__dirname, "src"),
      "@shared": resolve(__dirname, "../shared/dist"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.spec.ts"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
