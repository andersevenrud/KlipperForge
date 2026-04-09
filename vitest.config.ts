import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/**/*.test.{ts,tsx}", "packages/**/*.test.{ts,tsx}"],
    exclude: [...configDefaults.exclude, "**/e2e/**"],
  },
});
