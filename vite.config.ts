import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  // Serving path: "/" in dev; the Pages deploy sets PAGES_BASE=/<repo>/ so the
  // site works under projects.yaodub.com/<repo>/.
  base: process.env.PAGES_BASE ?? "/",
  plugins: [preact()],
  // DuckDB-WASM ships its own workers/wasm; keep them out of dep pre-bundling.
  optimizeDeps: { exclude: ["@duckdb/duckdb-wasm"] },
  build: { target: "es2022" },
});
