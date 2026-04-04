/**
 * Strip control characters (newlines, carriage returns, null bytes, etc.)
 * from a value destined for a Kconfig .config file.
 */
export function sanitizeConfigValue(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — stripping dangerous control chars
  return value.replace(/[\x00-\x1f\x7f]/g, "");
}

/**
 * Board IDs must be lowercase alphanumeric with hyphens, dots, or underscores.
 * Must start with a letter or digit — no path separators, no ".." sequences.
 */
const BOARD_ID_RE = /^[a-z0-9][a-z0-9._-]*$/;

export function isValidBoardId(id: string): boolean {
  return id.length > 0 && id.length <= 100 && BOARD_ID_RE.test(id) && !id.includes("..");
}

/**
 * Filenames used in shell commands and Content-Disposition headers
 * must contain only safe characters.
 */
const FILENAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function isValidFilename(name: string): boolean {
  return name.length > 0 && name.length <= 100 && FILENAME_RE.test(name) && !name.includes("..");
}

/**
 * Sanitize a filename for use in Content-Disposition headers.
 * Replaces unsafe characters and collapses dots.
 */
export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
  return cleaned || "firmware.bin";
}

/**
 * Validate a comma/space-separated list of Klipper pin names.
 * Pins can have optional prefix modifiers: ! (invert), ^ (pullup), ~ (pulldown).
 * Examples: "PA0", "!PB3", "^PC5", "PA0,PB1", "PA0 PB1"
 */
const PIN_NAME_RE = /^[!^~]*[A-Za-z][A-Za-z0-9_]*$/;

export function isValidPinList(pins: string): boolean {
  const parts = pins.split(/[,\s]+/).filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((p) => PIN_NAME_RE.test(p));
}
