import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5000,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  define: {
    global: "globalThis",
  },
});
