/**
 * Extracts Klipper section parameter definitions from Config_Reference.md
 * Outputs JSON files to packages/klipper-config/src/sections/generated/
 *
 * Usage: bun run scripts/extract-klipper-params.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const CONFIG_REF = join(ROOT, "_docs/klipper/docs/Config_Reference.md");
const OUTPUT_DIR = join(ROOT, "packages/klipper-config/src/sections/generated");
const SOURCE_TYPES_FILE = join(OUTPUT_DIR, "source-types.json");

interface ExtractedParam {
  name: string;
  required: boolean;
  type: ParamTypeInfo;
  description: string;
  default?: string | number | boolean;
}

type ParamTypeInfo =
  | { kind: "string" }
  | {
      kind: "number";
      integer?: boolean;
      min?: number;
      max?: number;
      above?: number;
      below?: number;
    }
  | { kind: "boolean" }
  | { kind: "choice"; choices: string[] }
  | { kind: "multiline" }
  | { kind: "list"; separator?: string; itemType?: "string" | "number" };

interface ExtractedSection {
  name: string;
  description: string;
  namingKind: "fixed" | "named" | "suffixed";
  prefix?: string;
  params: ExtractedParam[];
  inheritFrom?: string;
  inheritMode?: "all" | "above";
}

// Read Config_Reference.md
const content = readFileSync(CONFIG_REF, "utf-8");
const lines = content.split("\n");

// Parse all sections
const sections: ExtractedSection[] = [];

// Sections to skip (not user-configurable or too meta)
const SKIP_SECTIONS = new Set([
  "include",
  "duplicate_pin_override",
  "board_pins",
  "display_data",
  "display_template",
  "display_glyph",
  "menu",
  "sdcard_loop",
  "static_digital_output",
  "static_pwm_clock",
  "palette2",
  "replicape",
  "samd_sercom",
  "adc_scaled",
]);

// Sections that are "reference only" (their params come from another section)
// Pattern: "See the 'X' section for a description of the above parameters."
const _INHERIT_PATTERNS: Record<string, string> = {};

// Load source types from Python source extraction (if available)
interface SourceParamType {
  kind: string;
  integer?: boolean;
  min?: number;
  max?: number;
  above?: number;
  below?: number;
  default?: string | number | boolean;
}

interface SourceTypeIndex {
  byFile: Record<string, Record<string, SourceParamType>>;
  byParam: Record<string, SourceParamType>;
}

let sourceTypes: SourceTypeIndex | null = null;
if (existsSync(SOURCE_TYPES_FILE)) {
  sourceTypes = JSON.parse(readFileSync(SOURCE_TYPES_FILE, "utf-8"));
  console.log("Loaded source types from Python extraction");
}

function inferTypeFromSource(paramName: string, sectionName: string): ParamTypeInfo | null {
  if (!sourceTypes) return null;

  // Try section-specific lookup first
  const sectionParams = sourceTypes.byFile[sectionName];
  const sourceParam = sectionParams?.[paramName] ?? sourceTypes.byParam[paramName];
  if (!sourceParam) return null;

  switch (sourceParam.kind) {
    case "number": {
      const result: ParamTypeInfo = { kind: "number" };
      if (sourceParam.integer) result.integer = true;
      if (sourceParam.min !== undefined) result.min = sourceParam.min;
      if (sourceParam.max !== undefined) result.max = sourceParam.max;
      if (sourceParam.above !== undefined) result.above = sourceParam.above;
      if (sourceParam.below !== undefined) result.below = sourceParam.below;
      return result;
    }
    case "boolean":
      return { kind: "boolean" };
    case "string":
      return { kind: "string" };
    default:
      return null;
  }
}

function parseSectionHeading(line: string): { name: string; exampleName?: string } | null {
  const match = line.match(/^### \[([^\]]+)\]/);
  if (!match) return null;
  const raw = match[1];

  // e.g. "heater_fan heatbreak_cooling_fan" → prefix="heater_fan", example="heatbreak_cooling_fan"
  // e.g. "mcu my_extra_mcu" → prefix="mcu", example="my_extra_mcu"
  // e.g. "tmc2209 stepper_x" → prefix="tmc2209", example="stepper_x"
  const parts = raw.split(" ");
  if (parts.length === 2) {
    return { name: parts[0], exampleName: parts[1] };
  }
  return { name: raw };
}

function determineNaming(
  sectionName: string,
  exampleName?: string,
): { kind: "fixed" | "named" | "suffixed"; prefix?: string } {
  if (exampleName) {
    return { kind: "named", prefix: sectionName };
  }

  // Known suffixed sections (user picks the suffix like stepper_x, stepper_y)
  const suffixedPrefixes = ["stepper"];
  for (const p of suffixedPrefixes) {
    if (sectionName.startsWith(`${p}_`) && sectionName !== p) {
      return { kind: "suffixed", prefix: p };
    }
  }

  return { kind: "fixed" };
}

// Extract code blocks per section
interface RawSection {
  name: string;
  exampleName?: string;
  description: string;
  codeBlock: string;
}

function extractRawSections(): RawSection[] {
  const rawSections: RawSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const heading = parseSectionHeading(lines[i]);
    if (!heading) {
      i++;
      continue;
    }

    // Collect everything until the next section heading (or EOF)
    i++;
    const sectionLines: string[] = [];
    while (i < lines.length && !parseSectionHeading(lines[i])) {
      sectionLines.push(lines[i]);
      i++;
    }

    // Extract all code blocks from this section's content
    const codeBlocks: string[][] = [];
    const descLines: string[] = [];
    let j = 0;
    while (j < sectionLines.length) {
      if (sectionLines[j].startsWith("```")) {
        // Skip opening fence
        j++;
        const blockLines: string[] = [];
        while (j < sectionLines.length && !sectionLines[j].startsWith("```")) {
          blockLines.push(sectionLines[j]);
          j++;
        }
        // Skip closing fence
        if (j < sectionLines.length) j++;
        codeBlocks.push(blockLines);
      } else {
        if (codeBlocks.length === 0) {
          descLines.push(sectionLines[j]);
        }
        j++;
      }
    }

    if (codeBlocks.length === 0) continue;

    // Pick the code block that starts with '[' (the config block),
    // falling back to the first code block
    const configBlock = codeBlocks.find((block) => block[0]?.startsWith("[")) ?? codeBlocks[0];

    rawSections.push({
      name: heading.name,
      exampleName: heading.exampleName,
      description: descLines.join("\n").trim(),
      codeBlock: configBlock.join("\n"),
    });
  }

  return rawSections;
}

function inferDefaultFromSource(paramName: string, sectionName: string): string | number | boolean | undefined {
  if (!sourceTypes) return undefined;
  const sectionParams = sourceTypes.byFile[sectionName];
  const sourceParam = sectionParams?.[paramName] ?? sourceTypes.byParam[paramName];
  return sourceParam?.default;
}

function inferTypeFromSuffix(name: string): ParamTypeInfo | null {
  if (name.endsWith("_pin")) return { kind: "string" };
  if (name.endsWith("_pins")) return { kind: "string" };
  if (name === "serial" || name === "canbus_uuid" || name === "canbus_interface") return { kind: "string" };
  if (name.endsWith("_temp") || name === "min_temp" || name === "max_temp" || name === "min_extrude_temp")
    return { kind: "number" };
  if (
    name.endsWith("_speed") ||
    name.endsWith("_velocity") ||
    name === "max_velocity" ||
    name === "max_accel" ||
    name === "max_z_velocity" ||
    name === "max_z_accel"
  )
    return { kind: "number" };
  if (name.endsWith("_time") || name.endsWith("_timeout")) return { kind: "number" };
  if (name.endsWith("_distance") || name.endsWith("_dist") || name === "rotation_distance") return { kind: "number" };
  if (name.endsWith("_accel")) return { kind: "number" };
  if (name.endsWith("_count") || name === "microsteps") return { kind: "number", integer: true };
  if (name.endsWith("_rate")) return { kind: "number" };
  if (name.endsWith("_diameter")) return { kind: "number" };
  if (name.endsWith("_offset")) return { kind: "number" };
  if (name === "position_min" || name === "position_max" || name === "position_endstop") return { kind: "number" };
  if (name.endsWith("_duration")) return { kind: "number" };
  if (name.endsWith("_resistor")) return { kind: "number" };
  if (name === "minimum_cruise_ratio") return { kind: "number" };
  if (name.endsWith("_power")) return { kind: "number" };
  if (name.endsWith("_current")) return { kind: "number" };
  if (name.endsWith("_threshold")) return { kind: "number" };

  return null;
}

function inferTypeFromDefault(defaultStr: string): ParamTypeInfo | null {
  if (defaultStr === "True" || defaultStr === "False") return { kind: "boolean" };
  if (/^-?\d+$/.test(defaultStr)) return { kind: "number", integer: true };
  if (/^-?\d+\.\d+$/.test(defaultStr)) return { kind: "number" };
  return null;
}

function inferTypeFromDescription(desc: string, name: string): ParamTypeInfo | null {
  // Choice patterns
  const choiceMatch = desc.match(/(?:This option may be one of|The choices are|must be one of)[:\s]+([^.]+)\./i);
  if (choiceMatch) {
    const choicesStr = choiceMatch[1];
    const choices = choicesStr
      .split(/,\s*(?:and\s+|or\s+)?/)
      .map((c) => c.replace(/['"]/g, "").trim())
      .filter((c) => c.length > 0);
    if (choices.length >= 2) {
      return { kind: "choice", choices };
    }
  }

  // "either X or Y"
  const eitherMatch = desc.match(/(?:either|must be)\s+"?(\w+)"?\s+or\s+"?(\w+)"?/i);
  if (eitherMatch) {
    return { kind: "choice", choices: [eitherMatch[1], eitherMatch[2]] };
  }

  // Multiline indicators
  if (name === "gcode" || name.startsWith("gcode")) return { kind: "multiline" };
  if (desc.includes("list of G-Code") || desc.includes("list of g-code") || desc.includes("G-Code commands"))
    return { kind: "multiline" };

  // Number patterns in description
  if (
    desc.includes("(in mm") ||
    desc.includes("(in seconds") ||
    desc.includes("(in Celsius") ||
    desc.includes("(in ohms") ||
    desc.includes("(in amps") ||
    desc.includes("(in mm/s") ||
    desc.includes("(in mm/s^2") ||
    desc.includes("(in degrees") ||
    desc.includes("(in RPM") ||
    desc.includes("(expressed as a value from")
  )
    return { kind: "number" };

  return null;
}

function extractDefault(desc: string, defaultStr?: string): string | number | boolean | undefined {
  if (defaultStr !== undefined) {
    if (defaultStr === "True") return true;
    if (defaultStr === "False") return false;
    if (/^-?\d+$/.test(defaultStr)) return Number.parseInt(defaultStr, 10);
    if (/^-?\d+\.\d+$/.test(defaultStr)) return Number.parseFloat(defaultStr);
    // Don't use inline default string for non-numeric/boolean values
    // (they're often part of the description text, not actual defaults)
    return undefined;
  }

  // Try to extract from description: "The default is X"
  const defaultMatch = desc.match(/(?:The d|D)efault is\s+["']?(-?\d+(?:\.\d+)?|True|False)["']?/i);
  if (defaultMatch) {
    const val = defaultMatch[1].trim();
    if (val === "True") return true;
    if (val === "False") return false;
    if (/^-?\d+$/.test(val)) return Number.parseInt(val, 10);
    if (/^-?\d+\.\d+$/.test(val)) return Number.parseFloat(val);
  }

  // Try quoted string defaults: The default is "value"
  const quotedMatch = desc.match(/(?:The d|D)efault is\s+"([^"]+)"/i);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  return undefined;
}

function parseCodeBlock(
  codeBlock: string,
  sectionName: string,
): { params: ExtractedParam[]; inheritFrom?: string; inheritMode?: "all" | "above" } {
  const blockLines = codeBlock.split("\n");
  const params: ExtractedParam[] = [];
  let inheritFrom: string | undefined;
  let inheritMode: "all" | "above" | undefined;

  // Skip the first line if it's the section header [section_name ...]
  let startLine = 0;
  if (blockLines[0]?.startsWith("[")) {
    startLine = 1;
  }

  let currentParam: {
    name: string;
    required: boolean;
    defaultStr?: string;
    descLines: string[];
  } | null = null;

  function finalizeParam() {
    if (!currentParam) return;

    const desc = currentParam.descLines
      .map((l) => l.replace(/^#\s*/, "").trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Check for inherit pattern
    const inheritMatch = desc.match(/See the "(\w+)" section for a description/);

    // Determine type: source types (authoritative) → suffix → default → description → fallback
    let paramType: ParamTypeInfo = inferTypeFromSource(currentParam.name, sectionName) ??
      inferTypeFromSuffix(currentParam.name) ??
      (currentParam.defaultStr ? inferTypeFromDefault(currentParam.defaultStr) : null) ??
      inferTypeFromDescription(desc, currentParam.name) ?? { kind: "string" };

    // For driver_* registers, they're integers
    if (currentParam.name.startsWith("driver_")) {
      const defVal = currentParam.defaultStr;
      if (defVal && (defVal === "True" || defVal === "False")) {
        paramType = { kind: "boolean" };
      } else {
        paramType = { kind: "number", integer: true };
      }
    }

    // G-code fields must always be multiline
    if (currentParam.name === "gcode" || currentParam.name.endsWith("_gcode")) {
      paramType = { kind: "multiline" };
    }

    // Priority: Config_Reference.md default > Python source default
    const defaultVal =
      extractDefault(desc, currentParam.defaultStr) ?? inferDefaultFromSource(currentParam.name, sectionName);

    if (!inheritMatch) {
      params.push({
        name: currentParam.name,
        required: currentParam.required,
        type: paramType,
        description: desc || `${currentParam.name} parameter`,
        ...(defaultVal !== undefined ? { default: defaultVal } : {}),
      });
    }
  }

  for (let i = startLine; i < blockLines.length; i++) {
    const line = blockLines[i];

    // Check for inherit reference (whole block)
    const inheritBlockMatch = line.match(
      /^#\s*See the "(\w+)" section for (?:a description of )?(?:the above parameters|these parameters|configuration parameters)/,
    );
    if (inheritBlockMatch) {
      inheritFrom = inheritBlockMatch[1];
      inheritMode = line.includes("the above parameters") || line.includes("these parameters") ? "above" : "all";
      continue;
    }

    // Check for param lines (either required or optional)
    // Required: "param_name:" or "param_name: value"
    // Optional: "#param_name:" or "#param_name: value"
    const paramMatch = line.match(/^(#?)(\w+):\s*(.*?)$/);
    if (paramMatch) {
      // Finalize previous param
      finalizeParam();

      const isOptional = paramMatch[1] === "#";
      const paramName = paramMatch[2].toLowerCase();
      const valueStr = paramMatch[3].trim();

      // Skip variable_<name> placeholder params
      if (paramName.startsWith("variable_")) {
        currentParam = null;
        continue;
      }

      currentParam = {
        name: paramName,
        required: !isOptional,
        defaultStr: valueStr || undefined,
        descLines: [],
      };
      continue;
    }

    // Short-form param references (e.g., "#pin:", "#max_power:" without descriptions)
    // These inherit from another section
    const shortParamMatch = line.match(/^#(\w+):$/);
    if (shortParamMatch && currentParam === null) {
      // This is a short-form reference to a param from another section
      // We'll skip these as they come from inheritance
      continue;
    }

    // Description/comment lines for current param
    if (currentParam && line.startsWith("#")) {
      currentParam.descLines.push(line);
    }
  }

  // Finalize last param
  finalizeParam();

  return { params, inheritFrom, inheritMode };
}

// Main extraction
const rawSections = extractRawSections();

// Sections that share params with their base section (inheritance)
// heater_fan, controller_fan, etc. reference "fan" section params
// heater_bed references "extruder" section params
// stepper_z1 references "stepper" section
// extruder1 references "extruder" section
const BASE_PARAMS_CACHE = new Map<string, ExtractedParam[]>();

for (const raw of rawSections) {
  // Skip certain meta sections
  if (SKIP_SECTIONS.has(raw.name)) continue;

  // Skip variant sections like stepper_z1, extruder1 (they reference base)
  if (raw.name === "stepper_z1" || raw.name === "extruder1" || raw.name === "display") continue;

  // Skip variant sections that just reference the base section's params
  if (raw.exampleName === "my_extra_display") continue;
  if (raw.exampleName === "my_extra_mcu") continue;

  const naming = determineNaming(raw.name, raw.exampleName);
  const parsed = parseCodeBlock(raw.codeBlock, raw.name);

  const section: ExtractedSection = {
    name: raw.name,
    description: raw.description,
    namingKind: naming.kind,
    prefix: naming.prefix,
    params: parsed.params,
    inheritFrom: parsed.inheritFrom,
    inheritMode: parsed.inheritMode,
  };

  sections.push(section);
  BASE_PARAMS_CACHE.set(raw.name, parsed.params);
}

// Synthetic sections: sections not in Config_Reference.md but needed by KlipperForge
const SYNTHETIC_SECTIONS: ExtractedSection[] = [
  {
    name: "display_status",
    description: "Display status support. Enables display_status and M117 G-Code commands.",
    namingKind: "fixed",
    params: [],
  },
];

for (const synthetic of SYNTHETIC_SECTIONS) {
  if (!sections.some((s) => s.name === synthetic.name)) {
    sections.push(synthetic);
  }
}

// Post-process: fix conditionally-required params
// Some params are "required for X, Y, Z steppers" but optional in general
for (const section of sections) {
  if (section.name === "stepper") {
    const conditionallyOptional = ["enable_pin", "endstop_pin", "position_endstop", "position_max"];
    for (const param of section.params) {
      if (conditionallyOptional.includes(param.name)) {
        param.required = false;
      }
    }
  }
  // extruder control and pid params are conditionally required (only when PID)
  if (section.name === "extruder") {
    for (const param of section.params) {
      if (["control", "pid_kp", "pid_ki", "pid_kd"].includes(param.name)) {
        param.required = false;
      }
    }
  }
}

// Resolve inheritance: merge inherited params into sections that reference others
for (const section of sections) {
  if (section.inheritFrom) {
    const baseParams = BASE_PARAMS_CACHE.get(section.inheritFrom);
    if (baseParams) {
      const existingByName = new Map(section.params.map((p) => [p.name, p]));

      if (section.inheritMode === "above") {
        // "above" mode: only inherit params within the same range as the listed params.
        // This prevents e.g. heater_bed from inheriting stepper/extrusion params from extruder
        // while still picking up adjacent heater params like pid_kp, max_power, etc.
        const baseParamNames = baseParams.map((p) => p.name);
        const placeholders = section.params.filter((p) => p.description === `${p.name} parameter`);
        const matchedIndices = placeholders.map((p) => baseParamNames.indexOf(p.name)).filter((i) => i >= 0);

        if (matchedIndices.length > 0) {
          const minIdx = Math.min(...matchedIndices);
          const maxIdx = Math.max(...matchedIndices);

          for (let idx = minIdx; idx <= maxIdx; idx++) {
            const bp = baseParams[idx];
            const existing = existingByName.get(bp.name);
            if (!existing) {
              section.params.push({ ...bp, required: false });
            } else if (existing.description === `${existing.name} parameter`) {
              Object.assign(existing, { ...bp, required: false });
            }
          }
        }
      } else {
        // "all" mode: inherit everything from base
        for (const bp of baseParams) {
          const existing = existingByName.get(bp.name);
          if (!existing) {
            section.params.push({ ...bp, required: false });
          } else if (existing.description === `${existing.name} parameter`) {
            Object.assign(existing, { ...bp, required: false });
          }
        }
      }
    }
  }
}

// Also handle sections that list inherited params in short-form
// e.g. heater_fan lists "#pin:", "#max_power:" etc. and says "See the 'fan' section"
// We already handle this through the inheritFrom mechanism above
// But for sections like heater_bed which have their own params + inherit,
// make sure short-form params get proper definitions from the base
for (const section of sections) {
  if (section.params.length === 0 && section.inheritFrom) {
    const baseParams = BASE_PARAMS_CACHE.get(section.inheritFrom);
    if (baseParams) {
      section.params = baseParams.map((p) => ({ ...p }));
    }
  }
}

// Write output
mkdirSync(OUTPUT_DIR, { recursive: true });

// Group sections by category
const CATEGORY_MAP: Record<string, string> = {
  printer: "motion",
  stepper: "motion",
  extruder: "heating",
  extruder_stepper: "motion",
  manual_stepper: "motion",
  dual_carriage: "motion",
  heater_bed: "heating",
  heater_generic: "heating",
  temperature_sensor: "sensors",
  temperature_probe: "sensors",
  verify_heater: "heating",
  homing_heaters: "heating",
  thermistor: "heating",
  adc_temperature: "heating",
  fan: "fans",
  heater_fan: "fans",
  controller_fan: "fans",
  temperature_fan: "fans",
  fan_generic: "fans",
  probe: "probing",
  bltouch: "probing",
  smart_effector: "probing",
  probe_eddy_current: "probing",
  axis_twist_compensation: "probing",
  bed_mesh: "leveling",
  bed_tilt: "leveling",
  bed_screws: "leveling",
  screws_tilt_adjust: "leveling",
  z_tilt: "leveling",
  quad_gantry_level: "leveling",
  z_thermal_adjust: "leveling",
  safe_z_home: "homing",
  homing_override: "homing",
  endstop_phase: "homing",
  tmc2130: "drivers",
  tmc2208: "drivers",
  tmc2209: "drivers",
  tmc2660: "drivers",
  tmc2240: "drivers",
  tmc5160: "drivers",
  ad5206: "drivers",
  mcp4451: "drivers",
  mcp4728: "drivers",
  mcp4018: "drivers",
  input_shaper: "tuning",
  skew_correction: "tuning",
  resonance_tester: "tuning",
  adxl345: "sensors",
  icm20948: "sensors",
  lis2dw: "sensors",
  lis3dh: "sensors",
  bmi160: "sensors",
  mpu9250: "sensors",
  filament_switch_sensor: "sensors",
  filament_motion_sensor: "sensors",
  tsl1401cl_filament_width_sensor: "sensors",
  hall_filament_width_sensor: "sensors",
  load_cell: "sensors",
  load_cell_probe: "sensors",
  ads1x1x: "sensors",
  output_pin: "output",
  pwm_tool: "output",
  pwm_cycle_time: "output",
  servo: "output",
  led: "output",
  neopixel: "output",
  dotstar: "output",
  pca9533: "output",
  pca9632: "output",
  multi_pin: "output",
  gcode_macro: "macros",
  delayed_gcode: "macros",
  gcode_button: "macros",
  gcode_arcs: "macros",
  save_variables: "misc",
  idle_timeout: "misc",
  virtual_sdcard: "misc",
  force_move: "misc",
  pause_resume: "misc",
  firmware_retraction: "misc",
  respond: "misc",
  exclude_object: "misc",
  mcu: "mcu",
  sx1509: "misc",
  display_status: "misc",
  angle: "sensors",
};

// Build category groups
const categories = new Map<string, ExtractedSection[]>();
for (const section of sections) {
  const cat = CATEGORY_MAP[section.name] ?? "misc";
  if (!categories.has(cat)) {
    categories.set(cat, []);
  }
  categories.get(cat)?.push(section);
}

// Write individual JSON files per category
for (const [cat, catSections] of categories) {
  const output = catSections.map((s) => ({
    name: s.name,
    description: s.description,
    namingKind: s.namingKind,
    prefix: s.prefix,
    params: Object.fromEntries(
      s.params.map((p) => [
        p.name,
        {
          type: p.type,
          description: p.description,
          required: p.required,
          ...(p.default !== undefined ? { default: p.default } : {}),
        },
      ]),
    ),
  }));

  writeFileSync(join(OUTPUT_DIR, `${cat}.json`), JSON.stringify(output, null, "\t"));
}

// Write a summary file
const summary = sections.map((s) => ({
  name: s.name,
  category: CATEGORY_MAP[s.name] ?? "misc",
  paramCount: s.params.length,
  namingKind: s.namingKind,
}));

writeFileSync(join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, "\t"));

console.log(`Extracted ${sections.length} sections:`);
for (const [cat, catSections] of categories) {
  const totalParams = catSections.reduce((sum, s) => sum + s.params.length, 0);
  console.log(`  ${cat}: ${catSections.length} sections, ${totalParams} params`);
}
