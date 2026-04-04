/**
 * Extracts parameter type information from Klipper Python source files.
 * Parses config.getfloat(), config.getint(), config.getboolean(), config.get(), etc.
 * to provide authoritative type information for config parameters.
 *
 * Output: packages/klipper-config/src/sections/generated/source-types.json
 * Usage: bun run scripts/extract-klipper-source-types.ts
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const KLIPPY_DIR = join(ROOT, "_docs/klipper/klippy");
const EXTRAS_DIR = join(KLIPPY_DIR, "extras");
const OUTPUT_DIR = join(ROOT, "packages/klipper-config/src/sections/generated");
const OUTPUT_FILE = join(OUTPUT_DIR, "source-types.json");

interface SourceParamType {
  kind: "number" | "boolean" | "string" | "choice";
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

// Map Python filenames to section names where they differ
const FILE_TO_SECTION: Record<string, string | string[]> = {
  "fan.py": "fan",
  "heater_fan.py": "heater_fan",
  "controller_fan.py": "controller_fan",
  "fan_generic.py": "fan_generic",
  "temperature_fan.py": "temperature_fan",
  "heaters.py": ["extruder", "heater_generic", "heater_bed"],
  "probe.py": "probe",
  "bltouch.py": "bltouch",
  "tmc.py": ["tmc2130", "tmc2208", "tmc2209", "tmc2660", "tmc2240", "tmc5160"],
};

// Dynamic parameter name expansions (Python string concatenation patterns)
const DYNAMIC_PARAM_EXPANSIONS: Record<string, string[]> = {
  shaper_type_: ["shaper_type_x", "shaper_type_y", "shaper_type_z"],
  shaper_freq_: ["shaper_freq_x", "shaper_freq_y", "shaper_freq_z"],
  damping_ratio_: ["damping_ratio_x", "damping_ratio_y", "damping_ratio_z"],
};

/**
 * Join multi-line Python statements by tracking parenthesis depth.
 * Returns an array of logical lines (with continuations joined).
 */
function joinMultilineStatements(content: string): string[] {
  const rawLines = content.split("\n");
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (const line of rawLines) {
    current += (current ? " " : "") + line.trim();

    for (const ch of line) {
      if (ch === "(") parenDepth++;
      else if (ch === ")") parenDepth = Math.max(0, parenDepth - 1);
    }

    if (parenDepth === 0) {
      result.push(current);
      current = "";
    }
  }

  if (current) result.push(current);
  return result;
}

/**
 * Parse numeric constraint from a Python getfloat/getint call.
 * Matches patterns like `minval=0.`, `maxval=1.`, `above=0.`, `below=1.`
 */
function parseConstraint(line: string, name: string): number | undefined {
  // Match: name=<number> (Python float like 0., 1., -273.15, or int like 0, 1)
  const re = new RegExp(`${name}\\s*=\\s*(-?\\d+\\.?\\d*)`, "g");
  const match = re.exec(line);
  if (match) {
    return Number.parseFloat(match[1]);
  }
  return undefined;
}

/**
 * Check if a variable name is a direct config reference (not sconfig, pconfig, etc.)
 */
function isConfigVar(varName: string): boolean {
  return varName === "config" || varName === "self.config";
}

/**
 * Extract a literal default value from the 2nd positional argument of a config getter call.
 * Only captures literal values (numbers, booleans, quoted strings) — skips variable references.
 */
function extractGetterDefault(line: string, paramName: string, method: string): string | number | boolean | undefined {
  // Build a pattern that matches the param name then captures the 2nd positional arg
  // e.g. config.getfloat('param_name', 0.5, ...) or config.getint('param_name', 10)
  const escapedName = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (method === "float" || method === "int") {
    // Match: 'param_name', <number>  (before any keyword arg)
    const re = new RegExp(`['"]${escapedName}['"]\\s*,\\s*(-?\\d+\\.?\\d*)\\s*[,)]`);
    const m = re.exec(line);
    if (m) {
      return method === "int" ? Number.parseInt(m[1], 10) : Number.parseFloat(m[1]);
    }
  } else if (method === "boolean") {
    const re = new RegExp(`['"]${escapedName}['"]\\s*,\\s*(True|False)\\s*[,)]`);
    const m = re.exec(line);
    if (m) {
      return m[1] === "True";
    }
  } else if (method === "string") {
    const re = new RegExp(`['"]${escapedName}['"]\\s*,\\s*['"]([^'"]*)['"]\\s*[,)]`);
    const m = re.exec(line);
    if (m) {
      return m[1];
    }
  }

  return undefined;
}

/**
 * Extract parameter types from a single Python source file.
 */
function extractFromFile(filePath: string): Record<string, SourceParamType> {
  const content = readFileSync(filePath, "utf-8");
  const lines = joinMultilineStatements(content);
  const params: Record<string, SourceParamType> = {};

  // Pattern: <var>.getfloat('param_name' or <var>.getint('param_name' etc.
  // We need to capture the variable before the method call to filter out sconfig
  // The closing quote must NOT be followed by whitespace+plus (string concatenation)
  const getterPattern = /(\w+(?:\.\w+)?)\.get(float|int|boolean|choice)\(\s*['"]([\w]+)['"](?!\s*\+)/g;

  // Also match config.get('param_name' for string params (exclude concat)
  const getStringPattern = /(\w+(?:\.\w+)?)\.get\(\s*['"]([\w]+)['"](?!\s*\+)/g;

  // Pattern for set_config_field(config, "field", DEFAULT) calls (TMC driver registers)
  const setConfigFieldPattern = /set_config_field\(\s*config\s*,\s*"(\w+)"\s*,\s*(.+?)\s*[,)]/g;

  for (const line of lines) {
    for (const [, varName, method, paramName] of line.matchAll(getterPattern)) {
      if (!isConfigVar(varName)) continue;

      let paramType: SourceParamType;
      switch (method) {
        case "float": {
          paramType = { kind: "number" };
          const minval = parseConstraint(line, "minval");
          const maxval = parseConstraint(line, "maxval");
          const above = parseConstraint(line, "above");
          const below = parseConstraint(line, "below");
          if (minval !== undefined) paramType.min = minval;
          if (maxval !== undefined) paramType.max = maxval;
          if (above !== undefined) paramType.above = above;
          if (below !== undefined) paramType.below = below;
          break;
        }
        case "int": {
          paramType = { kind: "number", integer: true };
          const minval = parseConstraint(line, "minval");
          const maxval = parseConstraint(line, "maxval");
          if (minval !== undefined) paramType.min = minval;
          if (maxval !== undefined) paramType.max = maxval;
          break;
        }
        case "boolean":
          paramType = { kind: "boolean" };
          break;
        case "choice":
          paramType = { kind: "choice" };
          break;
        default:
          continue;
      }

      const defaultVal = extractGetterDefault(line, paramName, method);
      if (defaultVal !== undefined) paramType.default = defaultVal;

      params[paramName.toLowerCase()] = paramType;
    }

    // Match string getter: config.get('param_name', ...)
    for (const [, varName, paramName] of line.matchAll(getStringPattern)) {
      if (!isConfigVar(varName)) continue;
      // Don't override if we already have a more specific type
      if (!params[paramName.toLowerCase()]) {
        const paramType: SourceParamType = { kind: "string" };
        const defaultVal = extractGetterDefault(line, paramName, "string");
        if (defaultVal !== undefined) paramType.default = defaultVal;
        params[paramName.toLowerCase()] = paramType;
      }
    }

    // Match set_config_field(config, "field", DEFAULT) for TMC driver registers
    for (const [, fieldName, defaultExpr] of line.matchAll(setConfigFieldPattern)) {
      const trimmed = defaultExpr.trim();
      // Only capture literal defaults
      if (/^-?\d+$/.test(trimmed)) {
        const key = `driver_${fieldName.toLowerCase()}`;
        if (!params[key]) {
          params[key] = { kind: "number", integer: true, default: Number.parseInt(trimmed, 10) };
        } else if (params[key].default === undefined) {
          params[key].default = Number.parseInt(trimmed, 10);
        }
      } else if (trimmed === "True" || trimmed === "False") {
        const key = `driver_${fieldName.toLowerCase()}`;
        if (!params[key]) {
          params[key] = { kind: "boolean", default: trimmed === "True" };
        } else if (params[key].default === undefined) {
          params[key].default = trimmed === "True";
        }
      } else if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
        const key = `driver_${fieldName.toLowerCase()}`;
        const numVal = Number.parseInt(trimmed, 16);
        if (!params[key]) {
          params[key] = { kind: "number", integer: true, default: numVal };
        } else if (params[key].default === undefined) {
          params[key].default = numVal;
        }
      }
    }
  }

  // Handle dynamic parameter names (string concatenation patterns)
  // e.g. config.getfloat('shaper_freq_' + axis, ...)
  const dynamicPattern = /(\w+(?:\.\w+)?)\.get(float|int|boolean)\(\s*['"]([\w]+)['"]\s*\+/g;

  for (const line of lines) {
    for (const [, varName, method, prefix] of line.matchAll(dynamicPattern)) {
      if (!isConfigVar(varName)) continue;

      const expansions = DYNAMIC_PARAM_EXPANSIONS[prefix];
      if (!expansions) continue;

      let paramType: SourceParamType;
      switch (method) {
        case "float": {
          paramType = { kind: "number" };
          const minval = parseConstraint(line, "minval");
          const maxval = parseConstraint(line, "maxval");
          const above = parseConstraint(line, "above");
          const below = parseConstraint(line, "below");
          if (minval !== undefined) paramType.min = minval;
          if (maxval !== undefined) paramType.max = maxval;
          if (above !== undefined) paramType.above = above;
          if (below !== undefined) paramType.below = below;
          break;
        }
        case "int": {
          paramType = { kind: "number", integer: true };
          const minval = parseConstraint(line, "minval");
          const maxval = parseConstraint(line, "maxval");
          if (minval !== undefined) paramType.min = minval;
          if (maxval !== undefined) paramType.max = maxval;
          break;
        }
        case "boolean":
          paramType = { kind: "boolean" };
          break;
        default:
          continue;
      }

      for (const expanded of expansions) {
        params[expanded] = { ...paramType };
      }
    }
  }

  return params;
}

/**
 * Derive section name from Python filename.
 */
function sectionNameFromFile(filename: string): string {
  return basename(filename, ".py");
}

// Main extraction
const result: SourceTypeIndex = { byFile: {}, byParam: {} };

// Process extras directory
const pyFiles = readdirSync(EXTRAS_DIR)
  .filter((f) => f.endsWith(".py") && f !== "__init__.py")
  .sort();

for (const pyFile of pyFiles) {
  const filePath = join(EXTRAS_DIR, pyFile);
  const params = extractFromFile(filePath);

  if (Object.keys(params).length === 0) continue;

  const mappedSections = FILE_TO_SECTION[pyFile];
  const sectionNames = mappedSections
    ? Array.isArray(mappedSections)
      ? mappedSections
      : [mappedSections]
    : [sectionNameFromFile(pyFile)];

  for (const sectionName of sectionNames) {
    if (!result.byFile[sectionName]) {
      result.byFile[sectionName] = {};
    }
    Object.assign(result.byFile[sectionName], params);
  }

  // Also add to flat index
  for (const [paramName, paramType] of Object.entries(params)) {
    // Don't overwrite if we already have a more specific type
    if (!result.byParam[paramName]) {
      result.byParam[paramName] = paramType;
    }
  }
}

// Also process core klippy files (stepper.py, toolhead.py, mcu.py, etc.)
const coreFiles = ["stepper.py", "toolhead.py", "mcu.py"];
for (const coreFile of coreFiles) {
  const filePath = join(KLIPPY_DIR, coreFile);
  try {
    const params = extractFromFile(filePath);
    if (Object.keys(params).length === 0) continue;

    const sectionName = sectionNameFromFile(coreFile);
    if (!result.byFile[sectionName]) {
      result.byFile[sectionName] = {};
    }
    Object.assign(result.byFile[sectionName], params);

    for (const [paramName, paramType] of Object.entries(params)) {
      if (!result.byParam[paramName]) {
        result.byParam[paramName] = paramType;
      }
    }
  } catch {
    // File might not exist, skip
  }
}

writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, "\t"));

const sectionCount = Object.keys(result.byFile).length;
const paramCount = Object.keys(result.byParam).length;
const totalFileParams = Object.values(result.byFile).reduce((sum, params) => sum + Object.keys(params).length, 0);

console.log(`Extracted source types from ${pyFiles.length} Python files`);
console.log(`  ${sectionCount} sections, ${totalFileParams} section-specific params`);
console.log(`  ${paramCount} unique params in flat index`);
