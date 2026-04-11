import { isVirtualEndstop } from "./pin-formats";
import { isBoardPinsSection } from "./sections/schemas/board-pins";
import type { ConfigDocument, ConfigValue } from "./sections/types";

export interface BoardPinAlias {
  mcu: string;
  aliases: Record<string, string>;
}

const RESERVED_PINS = new Set(["<GND>", "<5V>", "<RST>"]);

/**
 * Parse "NAME=PIN, NAME2=PIN2, ..." format.
 * Handles multiline, inline comments, whitespace, and reserved pins.
 */
export function parsePinAliasString(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value) return result;

  // Remove inline comments (# to end of line)
  const cleaned = value
    .split("\n")
    .map((line) => line.replace(/#.*$/, ""))
    .join(",");

  // Split by comma and process each pair
  for (const part of cleaned.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const name = trimmed.slice(0, eqIdx).trim();
    const pin = trimmed.slice(eqIdx + 1).trim();

    if (name && pin) {
      result[name] = pin;
    }
  }

  return result;
}

/**
 * Extract BoardPinAlias[] from all board_pins sections in a ConfigDocument.
 */
export function extractBoardPinAliases(doc: ConfigDocument): BoardPinAlias[] {
  const result: BoardPinAlias[] = [];

  for (const section of doc.sections) {
    if (!isBoardPinsSection(section.definitionId)) {
      continue;
    }

    const mcu = typeof section.data.mcu === "string" ? section.data.mcu : "";
    const aliases: Record<string, string> = {};

    // Collect all aliases and aliases_* keys
    for (const [key, value] of Object.entries(section.data)) {
      if ((key === "aliases" || key.startsWith("aliases_")) && typeof value === "string") {
        Object.assign(aliases, parsePinAliasString(value));
      }
    }

    if (Object.keys(aliases).length > 0) {
      result.push({ mcu, aliases });
    }
  }

  return result;
}

/**
 * Resolve a pin value through the alias map.
 * Handles MCU prefix like "mcu2:FAN0".
 */
export function resolvePinAlias(pin: string, aliases: BoardPinAlias[]): string {
  if (!pin || RESERVED_PINS.has(pin)) return pin;

  // Check for MCU prefix
  const colonIdx = pin.indexOf(":");
  let mcuPrefix = "";
  let pinName = pin;

  if (colonIdx !== -1) {
    mcuPrefix = pin.slice(0, colonIdx);
    pinName = pin.slice(colonIdx + 1);
  }

  // Try to find alias match
  for (const board of aliases) {
    const matchesMcu = mcuPrefix === "" ? board.mcu === "" : board.mcu === mcuPrefix;
    if (matchesMcu && pinName in board.aliases) {
      const resolved = board.aliases[pinName];
      // Preserve MCU prefix on resolved pin
      return mcuPrefix ? `${mcuPrefix}:${resolved}` : resolved;
    }
  }

  return pin;
}

/**
 * Check if a pin name is a reserved pin.
 */
export function isReservedPin(pin: string): boolean {
  return RESERVED_PINS.has(pin);
}

/**
 * Invert alias maps: { FAN0: "PA8" } → { PA8: "FAN0" }.
 * Returns new BoardPinAlias[] with swapped key/value pairs.
 */
export function buildReverseAliasMap(aliases: BoardPinAlias[]): BoardPinAlias[] {
  return aliases.map((board) => {
    const reversed: Record<string, string> = {};
    for (const [name, pin] of Object.entries(board.aliases)) {
      reversed[pin] = name;
    }
    return { mcu: board.mcu, aliases: reversed };
  });
}

const PIN_PREFIX_RE = /^([!^~]*)(.*)/;

/**
 * Check if a pin value is a special value that should not be converted.
 */
function isSpecialPinValue(pin: string): boolean {
  if (!pin || RESERVED_PINS.has(pin)) return true;
  if (isVirtualEndstop(pin)) return true;
  return false;
}

/**
 * Convert all pin fields in a document between alias and raw GPIO names.
 * Pure function — returns a new document.
 */
export function convertDocumentPins(
  doc: ConfigDocument,
  aliases: BoardPinAlias[],
  direction: "aliases" | "raw",
): ConfigDocument {
  const lookupMap = direction === "aliases" ? buildReverseAliasMap(aliases) : aliases;

  const newSections = doc.sections.map((section) => {
    // Don't convert pin values inside board_pins sections themselves
    if (isBoardPinsSection(section.definitionId)) {
      return section;
    }

    let changed = false;
    const newData: Record<string, ConfigValue> = {};

    for (const [key, value] of Object.entries(section.data)) {
      if ((key === "pin" || key.endsWith("_pin")) && typeof value === "string" && value !== "") {
        const converted = convertSinglePin(value, lookupMap);
        newData[key] = converted;
        if (converted !== value) changed = true;
      } else {
        newData[key] = value;
      }
    }

    return changed ? { ...section, data: newData } : section;
  });

  const hasChanges = newSections.some((s, i) => s !== doc.sections[i]);
  return hasChanges ? { ...doc, sections: newSections } : doc;
}

/**
 * Convert a single pin value, preserving prefixes (!, ^, ~) and MCU prefixes.
 */
function convertSinglePin(pin: string, aliases: BoardPinAlias[]): string {
  if (isSpecialPinValue(pin)) return pin;

  // Handle MCU prefix (e.g., "mcu2:!PA8")
  const colonIdx = pin.indexOf(":");
  let mcuPrefix = "";
  let rest = pin;

  if (colonIdx !== -1) {
    mcuPrefix = pin.slice(0, colonIdx);
    rest = pin.slice(colonIdx + 1);
  }

  // Strip pin modifiers (!, ^, ~)
  const match = PIN_PREFIX_RE.exec(rest);
  if (!match) return pin;

  const modifiers = match[1];
  const pinName = match[2];

  if (!pinName) return pin;

  // Reconstruct pin with MCU prefix for alias lookup
  const lookupPin = mcuPrefix ? `${mcuPrefix}:${pinName}` : pinName;
  const resolved = resolvePinAlias(lookupPin, aliases);

  // If no conversion happened, return original
  if (resolved === lookupPin) return pin;

  // Strip MCU prefix from resolved value if present (resolvePinAlias preserves it)
  let resolvedName = resolved;
  if (mcuPrefix) {
    const rColonIdx = resolved.indexOf(":");
    if (rColonIdx !== -1) {
      resolvedName = resolved.slice(rColonIdx + 1);
    }
  }

  // Reconstruct with original modifiers and MCU prefix
  const withModifiers = `${modifiers}${resolvedName}`;
  return mcuPrefix ? `${mcuPrefix}:${withModifiers}` : withModifiers;
}
