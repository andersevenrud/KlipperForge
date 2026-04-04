import { defaultRegistry } from "@klipperforge/klipper-config";
import type { ConfigValue, SectionDefinition } from "@klipperforge/klipper-config";
import type { SectionParams } from "@klipperforge/klipper-config/sections/param-types";

export interface SectionCatalogEntry {
  definitionId: string;
  label: string;
  category: string;
  defaults: Record<string, ConfigValue>;
}

// Defaults beyond what param definitions provide (common starting values)
const DEFAULTS_OVERRIDES: Record<string, Record<string, ConfigValue>> = {
  extruder: {
    rotation_distance: 33.5,
    nozzle_diameter: 0.4,
    filament_diameter: 1.75,
    max_temp: 250,
  },
  tmc2209: { stealthchop_threshold: 999999 },
  tmc5160: { stealthchop_threshold: 999999 },
  bed_mesh: {
    speed: 120,
    horizontal_move_z: 5,
    mesh_min: "35, 6",
    mesh_max: "240, 198",
    probe_count: "5, 3",
  },
  safe_z_home: {
    home_xy_position: "117.5, 117.5",
    z_hop: 10,
    z_hop_speed: 5,
  },
  beacon: {
    mesh_main_direction: "x",
    default_probe_method: "contact",
    home_method: "contact",
  },
  heater_fan: { heater: "extruder" },
  controller_fan: { heater: "heater_bed" },
  filament_motion_sensor: { extruder: "extruder" },
  autotune_tmc: { voltage: 24 },
};

// Label overrides for definitions where the generated label isn't ideal
const LABEL_OVERRIDES: Record<string, string> = {
  pause_resume: "Pause/Resume",
  thermistor: "Custom Thermistor",
};

// Category overrides where the JSON source file category doesn't match the best UI grouping
const CATEGORY_OVERRIDES: Record<string, string> = {
  firmware_retraction: "Tuning",
  gcode_arcs: "Misc",
};

const CATEGORY_ORDER = [
  "Includes",
  "MCU",
  "Motion",
  "Stepper Drivers",
  "Heating",
  "Fans",
  "Probing",
  "Leveling",
  "Homing",
  "Tuning",
  "Sensors",
  "Output",
  "Macros",
  "Plugins",
  "Misc",
];

function computeDefaultsFromParams(params?: SectionParams): Record<string, ConfigValue> {
  if (!params) return {};
  const defaults: Record<string, ConfigValue> = {};
  for (const [key, param] of Object.entries(params)) {
    if (key.startsWith("_")) continue;
    if (param.default !== undefined) {
      defaults[key] = param.default as ConfigValue;
    }
  }
  return defaults;
}

function toEntry(def: SectionDefinition): SectionCatalogEntry {
  return {
    definitionId: def.id,
    label: LABEL_OVERRIDES[def.id] ?? def.label ?? def.id,
    category: CATEGORY_OVERRIDES[def.id] ?? def.category ?? "Misc",
    defaults: {
      ...computeDefaultsFromParams(def.params),
      ...(DEFAULTS_OVERRIDES[def.id] ?? {}),
    },
  };
}

export function getCatalogByCategory(): Map<string, SectionCatalogEntry[]> {
  const catalog = defaultRegistry.all().map(toEntry);
  const map = new Map<string, SectionCatalogEntry[]>();

  for (const cat of CATEGORY_ORDER) {
    const entries = catalog.filter((e) => e.category === cat).sort((a, b) => a.label.localeCompare(b.label));
    if (entries.length > 0) {
      map.set(cat, entries);
    }
  }

  // Append any categories not in CATEGORY_ORDER
  const known = new Set(CATEGORY_ORDER);
  const remaining = [...new Set(catalog.map((e) => e.category))].filter((c) => !known.has(c)).sort();
  for (const cat of remaining) {
    const entries = catalog.filter((e) => e.category === cat).sort((a, b) => a.label.localeCompare(b.label));
    if (entries.length > 0) {
      map.set(cat, entries);
    }
  }

  return map;
}
