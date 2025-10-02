import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.e2e-spec.ts"],
    setupFiles: ["./test/setup.ts"],
    maxConcurrency: 1,
    sequence: {
      concurrent: false,
    },
  },
});
