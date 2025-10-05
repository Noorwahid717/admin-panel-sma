import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // In development, use source files for HMR
      // In production build, use compiled dist for proper module resolution
      "@shared":
        mode === "production"
          ? path.resolve(__dirname, "../shared/dist")
          : path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
}));
