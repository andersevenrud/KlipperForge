import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };

function analyticsPlugin(enabled: boolean): Plugin {
  return {
    name: "conditional-analytics",
    transformIndexHtml(html) {
      if (!enabled) {
        return html.replace(/\s*<script[^>]*simpleanalyticscdn[^>]*><\/script>/, "");
      }
      return html;
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const analyticsEnabled = env.VITE_FEATURE_ANALYTICS !== "false";

  return {
    plugins: [react(), tailwindcss(), analyticsPlugin(analyticsEnabled)],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    build: {
      rolldownOptions: {
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
  };
});
