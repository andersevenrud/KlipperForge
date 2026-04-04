/**
 * Generates the OG image (1200x630 PNG) for social media previews.
 * Embeds the KlipperForge icon on a branded dark background with title text.
 *
 * Usage: bun run scripts/generate-og-image.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const ROOT = join(import.meta.dirname, "..");
const ICON_PATH = join(ROOT, "apps/klipperforge/public/klipperforge-icon.svg");
const OUTPUT_PATH = join(ROOT, "apps/klipperforge/public/og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;
const ICON_SIZE = 240;
const ICON_X = (WIDTH - ICON_SIZE) / 2;
const ICON_Y = 100;

const iconSvg = readFileSync(ICON_PATH, "utf-8");

// Extract inner content of the SVG (everything between the root <svg> tags)
const innerMatch = iconSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
if (!innerMatch) {
  throw new Error("Failed to parse icon SVG");
}
const iconInner = innerMatch[1];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A2535"/>
      <stop offset="100%" stop-color="#0A0F18"/>
    </linearGradient>
    <radialGradient id="ogGlow" cx="50%" cy="45%" r="40%">
      <stop offset="0%" stop-color="#FF6600" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FF0000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ogBg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ogGlow)"/>

  <!-- Icon (nested svg to clip filter overflow) -->
  <svg x="${ICON_X}" y="${ICON_Y}" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 200 200" overflow="hidden">
    ${iconInner}
  </svg>

  <!-- Title -->
  <text x="${WIDTH / 2}" y="${ICON_Y + ICON_SIZE + 70}" text-anchor="middle"
        font-family="IBM Plex Sans, Arial, sans-serif" font-weight="600"
        font-size="56" fill="#E0E0E0">KlipperForge</text>

  <!-- Subtitle -->
  <text x="${WIDTH / 2}" y="${ICON_Y + ICON_SIZE + 120}" text-anchor="middle"
        font-family="IBM Plex Sans, Arial, sans-serif" font-weight="400"
        font-size="28" fill="#8899AA">The Complete Klipper Toolkit</text>
</svg>`;

// Find the IBM Plex Sans font files
const fontDir = join(
  ROOT,
  "node_modules/.bun/@fontsource+ibm-plex-sans@5.2.8/node_modules/@fontsource/ibm-plex-sans/files",
);
const fontFiles = [
  join(fontDir, "ibm-plex-sans-latin-600-normal.woff2"),
  join(fontDir, "ibm-plex-sans-latin-400-normal.woff2"),
];

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: WIDTH },
  font: {
    fontFiles,
    defaultFontFamily: "IBM Plex Sans",
  },
});

const png = resvg.render().asPng();
writeFileSync(OUTPUT_PATH, png);

console.log(`Generated OG image: ${OUTPUT_PATH} (${png.length} bytes)`);
