/**
 * Validates that the CSS @theme block in app.css stays in sync
 * with the source of truth in @klipperforge/theme.
 *
 * Run: bun run scripts/validate-theme-sync.ts
 */
import { readFileSync } from "node:fs";
import { generateCssTheme } from "../packages/theme/src/ui-colors";

const cssPath = "apps/klipperforge/src/app.css";
const css = readFileSync(cssPath, "utf8");

const themeMatch = css.match(/@theme\s*\{([^}]+)\}/);
if (!themeMatch) {
  console.error("No @theme block found in", cssPath);
  process.exit(1);
}

const cssLines = themeMatch[1]
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("--"));

const expectedLines = generateCssTheme()
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.startsWith("--"));

let ok = true;
for (const expected of expectedLines) {
  if (!cssLines.includes(expected)) {
    console.error(`Missing or mismatched in CSS: ${expected}`);
    ok = false;
  }
}

if (ok) {
  console.log("Theme sync OK — CSS @theme matches @klipperforge/theme");
} else {
  console.error("\nCSS @theme is out of sync with @klipperforge/theme.");
  console.error("Update the @theme block in", cssPath, "to match packages/theme/src/ui-colors.ts");
  process.exit(1);
}
