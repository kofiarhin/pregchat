import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_TARGET = process.env.VITE_SERVER_PROXY_TARGET ?? "http://localhost:5001";

const createProxyConfig = () => {
  const routes = ["/auth", "/chat", "/updates", "/api", "/admin"];
  return routes.reduce((config, route) => {
    config[route] = {
      target: BACKEND_TARGET,
      changeOrigin: true,
      secure: false
    };
    return config;
  }, {});
};

const proxy = createProxyConfig();

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 5000,
    host: true,
    proxy
  },
  build: {
    outDir: "dist",
    sourcemap: true
  },
  define: {
    global: "globalThis"
  },
  test: {
    environment: "jsdom"
  }
});
