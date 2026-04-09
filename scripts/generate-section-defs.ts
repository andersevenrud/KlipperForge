/**
 * Generates TypeScript section definition files from extracted JSON data.
 * Reads from packages/klipper-config/src/sections/generated/*.json
 * Outputs .ts files to packages/klipper-config/src/sections/generated/
 *
 * Usage: bun run scripts/generate-section-defs.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GENERATED_DIR = join(ROOT, "packages/klipper-config/src/sections/generated");

interface ParamTypeInfo {
  kind: string;
  integer?: boolean;
  min?: number;
  max?: number;
  above?: number;
  below?: number;
  choices?: string[];
  separator?: string;
  itemType?: string;
}

interface ParamDef {
  type: ParamTypeInfo;
  description: string;
  required: boolean;
  default?: string | number | boolean;
}

interface SectionData {
  name: string;
  description: string;
  namingKind: "fixed" | "named" | "suffixed";
  prefix?: string;
  params: Record<string, ParamDef>;
}

// Sections that already have hand-written definitions (we'll generate params but not definitions)
const HAND_WRITTEN_SECTIONS = new Set([
  "printer",
  "mcu",
  "stepper",
  "extruder",
  "heater_bed",
  "fan",
  "heater_fan",
  "controller_fan",
  "fan_generic",
  "probe",
  "bltouch",
  "bed_mesh",
  "safe_z_home",
  "input_shaper",
  "tmc2209",
  "tmc5160",
  "filament_switch_sensor",
  "filament_motion_sensor",
  "temperature_sensor",
]);

// Section order values
const ORDER_MAP: Record<string, number> = {
  printer: 10,
  mcu: 15,
  stepper: 20,
  tmc2130: 22,
  tmc2208: 22,
  tmc2209: 22,
  tmc2660: 22,
  tmc2240: 22,
  tmc5160: 22,
  extruder: 25,
  extruder_stepper: 26,
  manual_stepper: 27,
  dual_carriage: 28,
  heater_bed: 30,
  heater_generic: 31,
  verify_heater: 32,
  homing_heaters: 33,
  thermistor: 34,
  adc_temperature: 34,
  fan: 35,
  heater_fan: 36,
  controller_fan: 37,
  fan_generic: 38,
  temperature_fan: 39,
  probe: 40,
  bltouch: 40,
  smart_effector: 40,
  probe_eddy_current: 40,
  bed_mesh: 45,
  safe_z_home: 46,
  input_shaper: 47,
  bed_tilt: 48,
  bed_screws: 48,
  screws_tilt_adjust: 48,
  z_tilt: 48,
  quad_gantry_level: 48,
  z_thermal_adjust: 48,
  axis_twist_compensation: 48,
  homing_override: 49,
  endstop_phase: 49,
  skew_correction: 50,
  filament_switch_sensor: 50,
  filament_motion_sensor: 50,
  temperature_sensor: 51,
  temperature_probe: 51,
  resonance_tester: 52,
  adxl345: 53,
  icm20948: 53,
  lis2dw: 53,
  lis3dh: 53,
  bmi160: 53,
  mpu9250: 53,
  output_pin: 55,
  pwm_tool: 55,
  pwm_cycle_time: 55,
  servo: 55,
  led: 56,
  neopixel: 56,
  dotstar: 56,
  pca9533: 56,
  pca9632: 56,
  multi_pin: 56,
  gcode_macro: 60,
  delayed_gcode: 60,
  gcode_button: 60,
  gcode_arcs: 60,
};

// Maps JSON category filenames to display names for the UI dropdown
const CATEGORY_MAP: Record<string, string> = {
  drivers: "Stepper Drivers",
  fans: "Fans",
  heating: "Heating",
  homing: "Homing",
  leveling: "Leveling",
  macros: "Macros",
  misc: "Misc",
  motion: "Motion",
  output: "Output",
  probing: "Probing",
  sensors: "Sensors",
  tuning: "Tuning",
};

// Labels where auto-derivation produces incorrect results
const LABEL_OVERRIDES: Record<string, string> = {
  ad5206: "AD5206",
  adc_temperature: "ADC Temperature",
  ads1x1x: "ADS1x1x",
  delayed_gcode: "Delayed G-Code",
  fan_generic: "Generic Fan",
  gcode_arcs: "G-Code Arcs",
  gcode_button: "G-Code Button",
  gcode_macro: "G-Code Macro",
  heater_generic: "Generic Heater",
  lis2dw: "LIS2DW",
  lis3dh: "LIS3DH",
  neopixel: "NeoPixel",
  tsl1401cl_filament_width_sensor: "TSL1401CL Filament Width Sensor",
  virtual_sdcard: "Virtual SD Card",
};

// Known abbreviations for label derivation
const ABBREVIATIONS: Record<string, string> = {
  adxl: "ADXL",
  bmi: "BMI",
  icm: "ICM",
  led: "LED",
  lis: "LIS",
  mcp: "MCP",
  mcu: "MCU",
  mpu: "MPU",
  pca: "PCA",
  pwm: "PWM",
  sd: "SD",
  sx: "SX",
  tmc: "TMC",
};

function deriveLabel(id: string): string {
  if (LABEL_OVERRIDES[id]) return LABEL_OVERRIDES[id];
  return id
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      for (const [abbr, replacement] of Object.entries(ABBREVIATIONS)) {
        if (lower === abbr) return replacement;
        if (lower.startsWith(abbr) && lower.length > abbr.length) {
          return replacement + word.slice(abbr.length);
        }
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function toIdentifier(sectionName: string): string {
  return sectionName.replace(/[^a-zA-Z0-9]/g, "_");
}

function toCamelCase(sectionName: string): string {
  return sectionName
    .split(/[_\s]+/)
    .map((part, i) => (i === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join("");
}

function serializeParamType(type: ParamTypeInfo): string {
  switch (type.kind) {
    case "string":
      return '{ kind: "string" }';
    case "number": {
      const parts = [`kind: "number"`];
      if (type.integer) parts.push("integer: true");
      if (type.min !== undefined) parts.push(`min: ${type.min}`);
      if (type.max !== undefined) parts.push(`max: ${type.max}`);
      if (type.above !== undefined) parts.push(`above: ${type.above}`);
      if (type.below !== undefined) parts.push(`below: ${type.below}`);
      return `{ ${parts.join(", ")} }`;
    }
    case "boolean":
      return '{ kind: "boolean" }';
    case "choice":
      return `{ kind: "choice", choices: [${type.choices?.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(", ")}] }`;
    case "multiline":
      return '{ kind: "multiline" }';
    case "list": {
      const parts = [`kind: "list"`];
      if (type.separator) parts.push(`separator: "${type.separator}"`);
      if (type.itemType) parts.push(`itemType: "${type.itemType}"`);
      return `{ ${parts.join(", ")} }`;
    }
    default:
      return '{ kind: "string" }';
  }
}

function serializeDefault(val: string | number | boolean): string {
  if (typeof val === "string") return `"${val.replace(/"/g, '\\"')}"`;
  if (typeof val === "boolean") return val ? "true" : "false";
  return String(val);
}

function escapeDescription(desc: string): string {
  return desc.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// Params where the type should be a variable reference instead of inline serialization
const PARAM_TYPE_OVERRIDES: Record<string, Record<string, string>> = {
  extruder: { sensor_type: '{ kind: "choice", choices: KNOWN_SENSOR_TYPES }' },
  heater_bed: { sensor_type: '{ kind: "choice", choices: KNOWN_SENSOR_TYPES }' },
  heater_generic: { sensor_type: '{ kind: "choice", choices: KNOWN_SENSOR_TYPES }' },
  resonance_tester: {
    accel_chip: '{ kind: "choice", choices: KNOWN_ACCEL_CHIPS }',
    accel_chip_x: '{ kind: "choice", choices: KNOWN_ACCEL_CHIPS }',
    accel_chip_y: '{ kind: "choice", choices: KNOWN_ACCEL_CHIPS }',
    accel_chip_z: '{ kind: "choice", choices: KNOWN_ACCEL_CHIPS }',
  },
};

// Sections with dynamic numbered fields that should be accepted without warnings
const ALLOWED_FIELD_PATTERNS: Record<string, string> = {
  bed_screws: "/^screw\\d+(_name|_fine_adjust)?$/",
  screws_tilt_adjust: "/^screw\\d+(_name)?$/",
};

// Params to exclude from generated output (deprecated or misplaced fields)
const PARAM_EXCLUSIONS: Record<string, Set<string>> = {
  heater_bed: new Set(["min_extrude_temp"]),
  output_pin: new Set(["maximum_mcu_duration", "static_value"]),
};

function generateParamsCode(sectionName: string, params: Record<string, ParamDef>): string {
  const id = toIdentifier(sectionName);
  const overrides = PARAM_TYPE_OVERRIDES[sectionName];
  const exclusions = PARAM_EXCLUSIONS[sectionName];
  const lines: string[] = [];
  lines.push(`export const ${id}Params: SectionParams = {`);

  for (const [paramName, param] of Object.entries(params)) {
    if (exclusions?.has(paramName)) continue;
    const typeOverride = overrides?.[paramName];
    lines.push(`\t${paramName}: {`);
    lines.push(`\t\ttype: ${typeOverride ?? serializeParamType(param.type)},`);
    lines.push(`\t\tdescription: "${escapeDescription(param.description)}",`);
    lines.push(`\t\trequired: ${param.required},`);
    if (param.default !== undefined) {
      lines.push(`\t\tdefault: ${serializeDefault(param.default)},`);
    }
    lines.push("\t},");
  }

  lines.push("};");
  return lines.join("\n");
}

// Sections whose naming in Config_Reference.md is "fixed" (no example name shown)
// but in practice they are "named" (e.g. [tmc2240 stepper_x])
const NAMING_OVERRIDES: Record<string, SectionData["namingKind"]> = {
  tmc2130: "named",
  tmc2208: "named",
  tmc2660: "named",
  tmc2240: "named",
  ad5206: "named",
  mcp4451: "named",
  mcp4728: "named",
  mcp4018: "named",
  led: "named",
  neopixel: "named",
  dotstar: "named",
  pca9533: "named",
  pca9632: "named",
  servo: "named",
  output_pin: "named",
  pwm_tool: "named",
  pwm_cycle_time: "named",
  multi_pin: "named",
  dual_carriage: "named",
  extruder_stepper: "named",
  manual_stepper: "named",
  heater_generic: "named",
  verify_heater: "named",
  thermistor: "named",
  adc_temperature: "named",
  temperature_fan: "named",
  probe_eddy_current: "named",
  endstop_phase: "named",
  mpu9250: "named",
  temperature_probe: "named",
  ads1x1x: "named",
  angle: "named",
  gcode_button: "named",
  sx1509: "named",
};

function generateDefinitionCode(section: SectionData, category: string): string {
  const id = toIdentifier(section.name);
  const camelId = toCamelCase(section.name);
  const order = ORDER_MAP[section.name] ?? 70;
  const displayCategory = CATEGORY_MAP[category] ?? category;
  const label = deriveLabel(section.name);

  const effectiveNaming = NAMING_OVERRIDES[section.name] ?? section.namingKind;

  let namingCode: string;
  switch (effectiveNaming) {
    case "fixed":
      namingCode = `{ kind: "fixed", header: "${section.name}" }`;
      break;
    case "named":
      namingCode = `{ kind: "named", prefix: "${section.prefix ?? section.name}" }`;
      break;
    case "suffixed":
      namingCode = `{ kind: "suffixed", prefix: "${section.prefix ?? section.name}" }`;
      break;
  }

  const allowedPattern = ALLOWED_FIELD_PATTERNS[section.name];

  return `export const ${camelId}Schema = createSchemaFromParams(${id}Params);

export const ${camelId}Definition: SectionDefinition<typeof ${camelId}Schema> = {
\tid: "${section.name}",
\tnaming: ${namingCode},
\tschema: ${camelId}Schema,
\tparams: ${id}Params,${allowedPattern ? `\n\tallowedFieldPattern: ${allowedPattern},` : ""}
\torder: ${order},
\tcategory: "${displayCategory}",
\tlabel: "${label}",
};`;
}

// Read all JSON category files
const jsonFiles = readdirSync(GENERATED_DIR).filter(
  (f) => f.endsWith(".json") && f !== "summary.json" && f !== "source-types.json",
);

const allSections: { category: string; sections: SectionData[] }[] = [];

for (const jsonFile of jsonFiles) {
  const category = jsonFile.replace(".json", "");
  const data: SectionData[] = JSON.parse(readFileSync(join(GENERATED_DIR, jsonFile), "utf-8"));
  allSections.push({ category, sections: data });
}

// Generate TypeScript files per category
const generatedDefinitions: {
  category: string;
  sectionName: string;
  camelId: string;
  id: string;
  isHandWritten: boolean;
}[] = [];

for (const { category, sections } of allSections) {
  const imports = ['import type { SectionParams } from "../param-types";'];

  const hasDefinitions = sections.some((s) => !HAND_WRITTEN_SECTIONS.has(s.name));
  if (hasDefinitions) {
    imports.push('import { createSchemaFromParams } from "../schema-from-params";');
    imports.push('import type { SectionDefinition } from "../types";');
  }

  const codeParts: string[] = [imports.join("\n"), ""];

  // Inject KNOWN_ACCEL_CHIPS constant for tuning category
  if (category === "tuning") {
    codeParts.push(`export const KNOWN_ACCEL_CHIPS = [
\t"adxl345",
\t"lis2dw",
\t"lis3dh",
\t"mpu9250",
\t"bmi160",
\t"icm20948",
];`);
    codeParts.push("");
  }

  // Inject KNOWN_SENSOR_TYPES constant for heating category
  if (category === "heating") {
    codeParts.push(`export const KNOWN_SENSOR_TYPES = [
\t// Thermistors
\t"EPCOS 100K B57560G104F",
\t"ATC Semitec 104GT-2",
\t"ATC Semitec 104NT-4-R025H42G",
\t"Generic 3950",
\t"Honeywell 100K 135-104LAG-J01",
\t"NTC 100K MGB18-104F39050L32",
\t"SliceEngineering 450",
\t"TDK NTCG104LH104JT1",
\t// ADC temperature sensors
\t"PT1000",
\t"PT100 INA826",
\t"AD595",
\t"AD597",
\t"AD8494",
\t"AD8495",
\t"AD8496",
\t"AD8497",
\t// SPI temperature sensors
\t"MAX6675",
\t"MAX31855",
\t"MAX31856",
\t"MAX31865",
\t// I2C / digital sensors
\t"BME280",
\t"DS18B20",
\t"SHT21",
\t"SI7013",
\t"SI7020",
\t"SI7021",
\t"HTU21D",
\t"SHT3X",
\t"AHT10",
\t"LM75",
\t// Built-in
\t"temperature_host",
\t"temperature_mcu",
\t"temperature_combined",
];`);
    codeParts.push("");
  }

  for (const section of sections) {
    const isHandWritten = HAND_WRITTEN_SECTIONS.has(section.name);
    const id = toIdentifier(section.name);
    const camelId = toCamelCase(section.name);

    // Always generate params
    codeParts.push(generateParamsCode(section.name, section.params));
    codeParts.push("");

    // Only generate definition/schema for non-hand-written sections
    if (!isHandWritten) {
      codeParts.push(generateDefinitionCode(section, category));
      codeParts.push("");
    }

    generatedDefinitions.push({
      category,
      sectionName: section.name,
      camelId,
      id,
      isHandWritten,
    });
  }

  writeFileSync(join(GENERATED_DIR, `${category}.ts`), codeParts.join("\n"));
}

// Generate index.ts that re-exports everything
const indexParts: string[] = [];

// Group by category
const categoryGroups = new Map<string, typeof generatedDefinitions>();
for (const def of generatedDefinitions) {
  if (!categoryGroups.has(def.category)) {
    categoryGroups.set(def.category, []);
  }
  categoryGroups.get(def.category)?.push(def);
}

for (const [category, defs] of categoryGroups) {
  const exports: string[] = [];
  for (const def of defs) {
    exports.push(`${def.id}Params`);
    if (!def.isHandWritten) {
      exports.push(`${def.camelId}Definition`);
      exports.push(`${def.camelId}Schema`);
    }
  }
  indexParts.push(`export { ${exports.join(", ")} } from "./${category}";`);
}

writeFileSync(join(GENERATED_DIR, "index.ts"), `${indexParts.join("\n")}\n`);

// Print summary
const newDefs = generatedDefinitions.filter((d) => !d.isHandWritten);
console.log(`Generated ${generatedDefinitions.length} param sets and ${newDefs.length} new definitions`);
for (const [cat, defs] of categoryGroups) {
  const newCount = defs.filter((d) => !d.isHandWritten).length;
  console.log(`  ${cat}: ${defs.length} params (${newCount} new definitions)`);
}
