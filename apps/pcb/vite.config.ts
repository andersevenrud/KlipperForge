import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig, loadEnv } from "vite";

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
    base: "/pcb-designer/",
    server: {
      port: 5174,
    },
  };
});
