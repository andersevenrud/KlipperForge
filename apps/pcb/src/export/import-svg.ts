import type { Connector, PcbConnectorCategory } from "../types";

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

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

interface ImportResult {
  connectors: Connector[];
  viewBoxWidth: number;
  viewBoxHeight: number;
}

export function parseSvg(svgText: string): ImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svg = doc.querySelector("svg");

  let viewBoxWidth = 800;
  let viewBoxHeight = 600;

  if (svg) {
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.split(/[\s,]+/);
      if (parts.length >= 4) {
        viewBoxWidth = Number.parseFloat(parts[2] ?? "0");
        viewBoxHeight = Number.parseFloat(parts[3] ?? "0");
      }
    }
  }

  const rects = doc.querySelectorAll("rect[data-klipperforge-name]");
  const connectors: Connector[] = [];
  let id = 1;

  for (const rect of rects) {
    const name = rect.getAttribute("data-klipperforge-name") ?? "";
    const category = rect.getAttribute("data-klipperforge-category") ?? "misc";
    const pinsRaw = rect.getAttribute("data-klipperforge-pins") ?? "";
    const pinHintsRaw = rect.getAttribute("data-klipperforge-pin-hints") ?? "";
    const title = rect.getAttribute("data-klipperforge-title") ?? "";
    const orientation = rect.getAttribute("data-klipperforge-orientation") ?? "horizontal";
    const rotation = Number.parseFloat(rect.getAttribute("data-klipperforge-rotation") ?? "0");
    const rows = Number.parseInt(rect.getAttribute("data-klipperforge-rows") ?? "1", 10);

    if (!name) continue;

    connectors.push({
      id: `imp_${id++}`,
      name,
      title,
      category: VALID_CATEGORIES.has(category) ? (category as PcbConnectorCategory) : "misc",
      x: Number.parseFloat(rect.getAttribute("x") ?? "0"),
      y: Number.parseFloat(rect.getAttribute("y") ?? "0"),
      width: Number.parseFloat(rect.getAttribute("width") ?? "0"),
      height: Number.parseFloat(rect.getAttribute("height") ?? "0"),
      pins: unescapeXml(pinsRaw),
      pinHints: unescapeXml(pinHintsRaw),
      orientation: orientation === "vertical" ? "vertical" : "horizontal",
      rotation: Number.isNaN(rotation) ? 0 : rotation,
      rows: Number.isNaN(rows) ? 1 : rows,
    });
  }

  return { connectors, viewBoxWidth, viewBoxHeight };
}

interface JsonConnector {
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
  rotation?: number;
  rows: number;
}

interface JsonLayout {
  viewBox: { width: number; height: number };
  connectors: JsonConnector[];
}

export function parseJson(jsonText: string): ImportResult {
  const layout: JsonLayout = JSON.parse(jsonText);

  const connectors: Connector[] = [];
  let id = 1;

  for (const c of layout.connectors) {
    connectors.push({
      id: `imp_${id++}`,
      name: c.name,
      title: c.title ?? "",
      category: VALID_CATEGORIES.has(c.category) ? (c.category as PcbConnectorCategory) : "misc",
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
      pins: c.pins.join(","),
      pinHints: c.pinHints?.join(",") ?? "",
      orientation: c.orientation === "vertical" ? "vertical" : "horizontal",
      rotation: c.rotation ?? 0,
      rows: c.rows,
    });
  }

  return {
    connectors,
    viewBoxWidth: layout.viewBox.width,
    viewBoxHeight: layout.viewBox.height,
  };
}
