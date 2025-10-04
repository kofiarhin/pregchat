// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_TARGET =
  process.env.VITE_SERVER_PROXY_TARGET ?? "http://localhost:5001";

const createProxyConfig = () => {
  // ❌ remove "/chat" — client-side route
  const routes = ["/api", "/auth", "/updates", "/admin"];
  return routes.reduce((config, route) => {
    config[route] = {
      target: BACKEND_TARGET,
      changeOrigin: true,
      secure: false,
    };
    return config;
  }, {});
};

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 4000, // fine to keep; just ensure backend isn’t also on 4000
    host: true,
    proxy: createProxyConfig(),
  },
  build: { outDir: "dist", sourcemap: true },
  define: { global: "globalThis" },
  test: { environment: "jsdom" },
});
