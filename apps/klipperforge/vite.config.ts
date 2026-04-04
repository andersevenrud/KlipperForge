import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api/firmware": {
        target: "http://localhost:3001",
        rewrite: (path) => path.replace(/^\/api\/firmware/, "/api"),
      },
      "/pcb-designer": {
        target: "http://localhost:5174",
      },
      "/api/configs": {
        target: "http://localhost:3002",
      },
      "/api/auth": {
        target: "http://localhost:3002",
      },
      "/api/shared": {
        target: "http://localhost:3002",
      },
    },
  },
});
