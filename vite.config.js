import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/",
  define: {
    global: "window",
  },
  server: {
    port: 9999,
    proxy: {
      "/api": {
        target: process.env.VITE_BE_API, 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), 
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
