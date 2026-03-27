import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const isTauri = process.env.TAURI_ENV_DEBUG !== undefined || process.env.TAURI_PLATFORM !== undefined;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  clearScreen: false,
  server: {
    host: "::",
    port: 8080,
    strictPort: isTauri,
    hmr: {
      overlay: false,
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: isTauri ? ["es2021", "chrome100", "safari13"] : "modules",
    minify: !isTauri || mode !== "development",
    sourcemap: !!isTauri,
  },
}));
