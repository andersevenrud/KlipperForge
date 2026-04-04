/**
 * Extracts PCB connector layout from an SVG file containing metadata rects.
 *
 * Convention: place <rect> elements with these data attributes:
 *   data-klipperforge-name="MOTOR0"              (connector name)
 *   data-klipperforge-category="stepper"          (component category)
 *   data-klipperforge-pins="PF14,PF13,PF12,PC4"  (comma-separated pin names, may include <GND>, <5V>, etc.)
 *   data-klipperforge-pin-hints="EN,STEP,DIR,CS"  (optional: hint labels for each pin)
 *   data-klipperforge-title="Voltage Select"        (optional: human-readable title)
 *   data-klipperforge-orientation="horizontal"     (pin orientation: horizontal or vertical)
 *   data-klipperforge-rows="1"                    (number of rows/columns of pins)
 *
 * Usage:
 *   bun run scripts/extract-pcb-layout.ts <input.svg> <board-id> [board-name]
 *
 * Output: data/pcb-layouts/<board-id>.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const VALID_CATEGORIES = new Set([
  "stepper",
  "fan",
  "heater",
  "thermistor",
  "endstop",
  "display",
  "probe",
  "power",
  "communication",
  "driver",
  "jumper",
  "button",
  "dip-switch",
  "misc",
]);

function extractAttr(element: string, attr: string): string | null {
  const pattern = new RegExp(`(?:^|\\s)${attr}\\s*=\\s*["']([^"']*)["']`);
  const match = element.match(pattern);
  return match ? match[1] : null;
}

function extractNum(element: string, attr: string): number {
  const val = extractAttr(element, attr);
  return val ? Number.parseFloat(val) : 0;
}

/** Decode XML entities like &lt; &gt; &amp; */
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function main() {
  const args = process.argv.slice(2);
  // Parse --image flag
  const imageIdx = args.indexOf("--image");
  let imagePath: string | undefined;
  if (imageIdx !== -1) {
    imagePath = args[imageIdx + 1];
    args.splice(imageIdx, 2);
  }

  if (args.length < 2) {
    console.error("Usage: bun run scripts/extract-pcb-layout.ts <input.svg> <board-id> [name] [--image path]");
    process.exit(1);
  }

  const [svgPath, boardId, boardName] = args;
  const svg = readFileSync(resolve(svgPath), "utf-8");

  // Extract viewBox from root <svg>
  const svgTagMatch = svg.match(/<svg[^>]*>/);
  if (!svgTagMatch) {
    console.error("No <svg> element found");
    process.exit(1);
  }
  const viewBoxStr = extractAttr(svgTagMatch[0], "viewBox");
  if (!viewBoxStr) {
    console.error("No viewBox attribute on <svg> element");
    process.exit(1);
  }
  const vbParts = viewBoxStr.split(/[\s,]+/).map(Number);
  const vbWidth = vbParts[2];
  const vbHeight = vbParts[3];

  // Find translate transform on parent <g> of metadata rects
  // Look for the <g> that immediately precedes the first data-klipperforge rect
  let translateX = 0;
  let translateY = 0;
  const translateMatch = svg.match(
    /transform\s*=\s*["']translate\(([^,)]+),([^)]+)\)["'][^>]*>[\s\S]*?data-klipperforge-/,
  );
  if (translateMatch) {
    translateX = Number.parseFloat(translateMatch[1]);
    translateY = Number.parseFloat(translateMatch[2]);
    console.log(`Found parent transform: translate(${translateX}, ${translateY})`);
  }

  // Find all <rect> elements with data-klipperforge-category
  const rectPattern = /<rect[^>]*data-klipperforge-category[^>]*\/?>/g;
  interface ParsedConnector {
    name: string;
    title?: string;
    category: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pins: string[];
    pinHints?: string[];
    orientation: string;
    rows: number;
  }

  const connectors: ParsedConnector[] = [];

  for (const match of svg.matchAll(rectPattern)) {
    const el = match[0];

    const name = extractAttr(el, "data-klipperforge-name");
    const title = extractAttr(el, "data-klipperforge-title");
    const category = extractAttr(el, "data-klipperforge-category");
    const pinsRaw = extractAttr(el, "data-klipperforge-pins");
    const hintsRaw = extractAttr(el, "data-klipperforge-pin-hints");
    const orientation = extractAttr(el, "data-klipperforge-orientation") ?? "horizontal";
    const rotationRaw = extractAttr(el, "data-klipperforge-rotation");
    const rotationVal = rotationRaw ? Number.parseFloat(rotationRaw) : 0;
    const rows = Number.parseInt(extractAttr(el, "data-klipperforge-rows") ?? "1", 10);

    if (!name) {
      console.warn("Skipping rect without data-klipperforge-name");
      continue;
    }
    if (!category || !VALID_CATEGORIES.has(category)) {
      console.warn(`Skipping "${name}": invalid category "${category}"`);
      continue;
    }

    const pins = pinsRaw
      ? decodeXmlEntities(pinsRaw)
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    const pinHints = hintsRaw
      ? hintsRaw
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      : undefined;

    const x = extractNum(el, "x") + translateX;
    const y = extractNum(el, "y") + translateY;
    const width = extractNum(el, "width");
    const height = extractNum(el, "height");

    connectors.push({
      name,
      ...(title && { title }),
      category,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100,
      pins,
      ...(pinHints && { pinHints }),
      orientation: orientation === "vertical" ? "vertical" : "horizontal",
      ...(rotationVal !== 0 && { rotation: Math.round(rotationVal * 100) / 100 }),
      rows,
    });
  }

  if (connectors.length === 0) {
    console.error("No metadata rects found.");
    process.exit(1);
  }

  const layout = {
    boardId,
    name: boardName ?? boardId,
    viewBox: {
      width: Math.round(vbWidth * 100) / 100,
      height: Math.round(vbHeight * 100) / 100,
    },
    ...(imagePath && { image: imagePath }),
    connectors,
  };

  const outputPath = resolve("data/pcb-layouts", `${boardId}.json`);
  writeFileSync(outputPath, `${JSON.stringify(layout, null, "\t")}\n`);

  console.log(`Extracted ${connectors.length} connectors from SVG`);
  console.log(`Output: ${outputPath}`);

  const byCat = new Map<string, number>();
  for (const c of connectors) {
    byCat.set(c.category, (byCat.get(c.category) ?? 0) + 1);
  }
  for (const [cat, count] of [...byCat.entries()].sort()) {
    console.log(`  ${cat}: ${count}`);
  }
}

main();
