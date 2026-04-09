export const UI_COLORS = {
  background: "#121212",
  foreground: "#e0e0e0",
  muted: "#272727",
  mutedForeground: "#9e9e9e",
  border: "#333333",
  input: "#333333",
  ring: "#d41116",
  primary: "#d41116",
  primaryForeground: "#ffffff",
  secondary: "#272727",
  secondaryForeground: "#e0e0e0",
  accent: "#272727",
  accentForeground: "#e0e0e0",
  destructive: "#f56565",
  destructiveForeground: "#121212",
  card: "#1e1e1e",
  cardForeground: "#e0e0e0",
  popover: "#1e1e1e",
  popoverForeground: "#e0e0e0",
} as const;

export const UI_RADII = {
  sm: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
} as const;

export const UI_FONTS = {
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  sans: '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
} as const;

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function generateCssTheme(): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(UI_COLORS)) {
    lines.push(`  --color-${camelToKebab(key)}: ${value};`);
  }
  for (const [key, value] of Object.entries(UI_RADII)) {
    lines.push(`  --radius-${key}: ${value};`);
  }
  lines.push(`  --font-mono: ${UI_FONTS.mono};`);
  return lines.join("\n");
}
