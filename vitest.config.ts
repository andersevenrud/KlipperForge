import { configDefaults, defineConfig } from "vitest/config";
import pkg from "./apps/klipperforge/package.json" with { type: "json" };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ["apps/**/*.test.{ts,tsx}", "packages/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "**/e2e/**"],
  },
});
