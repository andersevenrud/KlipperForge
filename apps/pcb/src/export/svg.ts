import type { Connector } from "../types";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateSvg(connectors: Connector[], imageWidth: number, imageHeight: number): string {
  const lines: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imageWidth} ${imageHeight}">`);

  for (const conn of connectors) {
    const attrs: string[] = [
      `x="${conn.x.toFixed(2)}"`,
      `y="${conn.y.toFixed(2)}"`,
      `width="${conn.width.toFixed(2)}"`,
      `height="${conn.height.toFixed(2)}"`,
      `data-klipperforge-name="${escapeXml(conn.name)}"`,
      `data-klipperforge-category="${conn.category}"`,
      `data-klipperforge-pins="${escapeXml(conn.pins)}"`,
    ];

    if (conn.pinHints) {
      attrs.push(`data-klipperforge-pin-hints="${escapeXml(conn.pinHints)}"`);
    }

    if (conn.title) {
      attrs.push(`data-klipperforge-title="${escapeXml(conn.title)}"`);
    }

    attrs.push(`data-klipperforge-orientation="${conn.orientation}"`);

    if (conn.rotation !== 0) {
      attrs.push(`data-klipperforge-rotation="${conn.rotation}"`);
    }

    attrs.push(`data-klipperforge-rows="${conn.rows}"`);

    lines.push(`  <rect ${attrs.join(" ")} />`);
  }

  lines.push("</svg>");
  return lines.join("\n");
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
