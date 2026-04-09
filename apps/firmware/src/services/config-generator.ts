import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config";
import type { FirmwarePreset } from "../types";
import { isValidPinList, sanitizeConfigValue } from "../utils/sanitize";

let presetCache: Map<string, FirmwarePreset> | null = null;

function loadPresets(): Map<string, FirmwarePreset> {
  if (presetCache) return presetCache;

  presetCache = new Map();
  const presetDir = config.presetDataPath;

  if (!existsSync(presetDir)) return presetCache;

  for (const file of readdirSync(presetDir)) {
    if (!file.endsWith(".json")) continue;
    const content = readFileSync(join(presetDir, file), "utf-8");
    const preset = JSON.parse(content) as FirmwarePreset;
    presetCache.set(preset.mcuFamily, preset);
  }

  return presetCache;
}

export function findPresetForMcu(mcu: string): FirmwarePreset | null {
  const presets = loadPresets();

  // Direct match first
  const direct = presets.get(mcu);
  if (direct) return direct;

  // Pattern match
  for (const preset of presets.values()) {
    for (const pattern of preset.mcuPatterns) {
      if (mcu.startsWith(pattern) || mcu === pattern) {
        return preset;
      }
    }
  }

  return null;
}

export function generateDotConfig(
  preset: FirmwarePreset,
  interfaceId: string,
  options?: Record<string, string>,
): string {
  const lines: string[] = [];

  // Base config
  for (const [key, value] of Object.entries(preset.base)) {
    lines.push(`${key}=${value}`);
  }

  // Interface config
  const iface = preset.interfaces[interfaceId];
  if (iface) {
    for (const [key, value] of Object.entries(iface.config)) {
      lines.push(`${key}=${value}`);
    }
  }

  // Bootloader offset — default to first entry when not specified (e.g., single-option presets
  // where the UI hides the dropdown). Without an explicit offset, make olddefconfig picks
  // the first *visible* Kconfig choice, which is never "No bootloader".
  const bootloaderKey = options?.bootloaderOffset ?? Object.keys(preset.bootloaderOffsets)[0];
  if (bootloaderKey && Object.hasOwn(preset.bootloaderOffsets, bootloaderKey)) {
    const blConfig = preset.bootloaderOffsets[bootloaderKey]?.config;
    if (blConfig) {
      for (const [key, value] of Object.entries(blConfig)) {
        lines.push(`${key}=${value}`);
      }
    }
  }

  // Clock reference — default to first entry when not specified
  const clockRefKey = options?.clockRef ?? Object.keys(preset.clockRefs)[0];
  if (clockRefKey && Object.hasOwn(preset.clockRefs, clockRefKey)) {
    const crConfig = preset.clockRefs[clockRefKey]?.config;
    if (crConfig) {
      for (const [key, value] of Object.entries(crConfig)) {
        lines.push(`${key}=${value}`);
      }
    }
  }

  // Interface-specific options (e.g., CAN bus frequency) — validate against allowed values
  if (iface?.options && options) {
    for (const opt of iface.options) {
      const value = options[opt.key];
      if (value && opt.values.includes(value)) {
        lines.push(`${opt.key}=${sanitizeConfigValue(value)}`);
      }
    }
  }

  // Initial pins (GPIO pins to set at MCU startup) — validate pin format
  const initialPins = options?.CONFIG_INITIAL_PINS?.trim();
  if (initialPins && isValidPinList(initialPins)) {
    lines.push(`CONFIG_INITIAL_PINS="${sanitizeConfigValue(initialPins)}"`);
  }

  return `${lines.join("\n")}\n`;
}

export function hashConfig(configContent: string): string {
  return createHash("sha256").update(configContent).digest("hex").slice(0, 16);
}
