import { isVirtualEndstop, matchesKnownPinFormat } from "../pin-formats";
import { extractBoardPinAliases, isReservedPin, resolvePinAlias } from "../pins";
import { applyControlVisibility, applyFieldGroups, applySensorTypeVisibility } from "./field-groups";
import type { ParamDefinition } from "./param-types";
import { resolveHeader as resolveHeaderBase, type SectionRegistry } from "./registry";
import { SHARED_BUS_PIN_FIELDS } from "./section-modes";
import type { ConfigDocument, SectionInstance } from "./types";

export interface SectionValidationError {
  section: string;
  field?: string;
  message: string;
  severity?: "error" | "warning" | "info";
}

export interface BoardPinContext {
  alias: string;
  mcu: string;
  pins: string[];
  aliases: Record<string, string>;
}

export interface ValidateDocumentOptions {
  boards?: BoardPinContext[];
}

interface PinUsageEntry {
  section: string;
  field: string;
  originalPin: string;
}

function resolveHeader(instance: SectionInstance, registry: SectionRegistry): string {
  return resolveHeaderBase(instance, registry) ?? instance.definitionId;
}

export function validateDocument(
  doc: ConfigDocument,
  registry: SectionRegistry,
  options?: ValidateDocumentOptions,
): SectionValidationError[] {
  const errors: SectionValidationError[] = [];

  // Per-instance schema validation
  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    if (instance.definitionId === "__comment__") continue;
    const def = registry.get(instance.definitionId);
    const header = resolveHeader(instance, registry);

    if (!def) {
      errors.push({
        section: header,
        message: `Unknown section definition: ${instance.definitionId}`,
      });
      continue;
    }

    const result = def.schema.safeParse(instance.data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          section: header,
          field: issue.path.join("."),
          message: issue.message,
        });
      }
    }

    // Unknown field detection
    if (def.params) {
      const metaFields = new Set(def.metaFields ?? []);
      for (const key of Object.keys(instance.data)) {
        if (!def.params[key] && !metaFields.has(key) && !def.allowedFieldPattern?.test(key)) {
          errors.push({
            section: header,
            field: key,
            message: `Unknown option "${key}" — Klipper does not recognize this field in [${header}]`,
            severity: "warning",
          });
        }
      }
    }

    // Warn when a field has a value but its visibleWhen dependency is unset
    if (def.params) {
      const entries = Object.entries(def.params) as [string, ParamDefinition][];
      const resolved = applySensorTypeVisibility(
        applyControlVisibility(applyFieldGroups(entries, instance.definitionId)),
      );
      for (const [name, param] of resolved) {
        if (param.visibleWhen && instance.data[name] != null && instance.data[param.visibleWhen.field] == null) {
          errors.push({
            section: header,
            field: name,
            message: `"${name}" has no effect — requires "${param.visibleWhen.field}" set to "${param.visibleWhen.value}"`,
            severity: "warning",
          });
        }
      }
    }

    if (instance.instanceName && def.namePattern && !def.namePattern.test(instance.instanceName)) {
      errors.push({
        section: header,
        message: `Invalid name "${instance.instanceName}" — only letters, digits, and underscores are allowed`,
      });
    }
  }

  // Duplicate section detection
  const isMultiFile = doc.files && doc.files.length > 1;
  const defaultFile = doc.files?.[0] ?? "printer.cfg";
  const headerCounts = new Map<string, { count: number; files: Set<string> }>();
  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    if (instance.definitionId === "__comment__") continue;
    const header = resolveHeader(instance, registry);
    const file = instance.file ?? defaultFile;
    const entry = headerCounts.get(header);
    if (entry) {
      entry.count++;
      entry.files.add(file);
    } else {
      headerCounts.set(header, { count: 1, files: new Set([file]) });
    }
  }
  for (const [header, { count, files }] of headerCounts) {
    if (count <= 1) continue;
    const location = isMultiFile ? ` (in ${[...files].join(", ")})` : "";
    errors.push({
      section: header,
      message: `Duplicate section: [${header}] appears ${count} times${location}`,
      severity: "error",
    });
  }

  // Structural: require essential sections (only count enabled sections)
  const headers = new Set(doc.sections.filter((s) => !s.disabled).map((s) => resolveHeader(s, registry)));

  if (!headers.has("printer")) {
    errors.push({
      section: "printer",
      message: "Missing required section: [printer]",
    });
  }
  if (!headers.has("mcu")) {
    errors.push({
      section: "mcu",
      message: "Missing required section: [mcu]",
    });
  }
  for (const axis of ["x", "y", "z"]) {
    if (!headers.has(`stepper_${axis}`)) {
      errors.push({
        section: `stepper_${axis}`,
        message: `Missing required section: [stepper_${axis}]`,
      });
    }
  }

  // Require position_endstop on primary axis steppers
  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    if (instance.definitionId !== "stepper") continue;
    if (instance.instanceName !== "x" && instance.instanceName !== "y" && instance.instanceName !== "z") continue;
    const endstopPin = typeof instance.data.endstop_pin === "string" ? instance.data.endstop_pin : "";
    if (instance.data.position_endstop === undefined && !endstopPin.includes("virtual_endstop")) {
      errors.push({
        section: resolveHeader(instance, registry),
        field: "position_endstop",
        message: "position_endstop is required for stepper_x, stepper_y, and stepper_z",
      });
    }
  }
  // Require control on heater sections (can be in section data or #*# save_config)
  const heaterDefIds = new Set(["extruder", "heater_bed"]);
  const saveConfigValues = new Map<string, Record<string, unknown>>();
  if (doc.saveConfigSections) {
    for (const sc of doc.saveConfigSections) {
      saveConfigValues.set(sc.name, sc.values);
    }
  }

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    if (!heaterDefIds.has(instance.definitionId)) continue;
    const header = resolveHeader(instance, registry);
    if (instance.data.control !== undefined) continue;
    if (saveConfigValues.get(header)?.control !== undefined) continue;
    errors.push({
      section: header,
      field: "control",
      message: `control is required for [${header}] (must be set in section or in #*# save_config)`,
    });
  }

  if (!headers.has("extruder")) {
    errors.push({
      section: "extruder",
      message: "Missing required section: [extruder]",
    });
  }

  // Pin conflict detection (alias-aware)
  const boardAliases = extractBoardPinAliases(doc);
  const pinUsage = new Map<string, PinUsageEntry[]>();

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    const header = resolveHeader(instance, registry);
    for (const [key, value] of Object.entries(instance.data)) {
      if ((key.endsWith("_pin") || key === "pin") && typeof value === "string" && value !== "") {
        const strippedPin = value.replace(/^[!^~]*/, "");
        const resolvedPin = resolvePinAlias(strippedPin, boardAliases);
        const existing = pinUsage.get(resolvedPin);
        if (existing) {
          existing.push({ section: header, field: key, originalPin: strippedPin });
        } else {
          pinUsage.set(resolvedPin, [{ section: header, field: key, originalPin: strippedPin }]);
        }
      }
    }
  }

  for (const [resolvedPin, usages] of pinUsage) {
    if (usages.length > 1) {
      const allShareable = usages.every((u) => SHARED_BUS_PIN_FIELDS.has(u.field));
      if (allShareable) continue;

      const locations = usages.map((u) => `[${u.section}] ${u.field}`).join(", ");
      for (const usage of usages) {
        const pinLabel = usage.originalPin !== resolvedPin ? `${usage.originalPin} (${resolvedPin})` : resolvedPin;
        errors.push({
          section: usage.section,
          field: usage.field,
          message: `Pin "${pinLabel}" is also used in: ${locations}`,
          severity: "warning",
        });
      }
    }
  }

  // Pin format and board membership validation
  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    const header = resolveHeader(instance, registry);
    for (const [key, value] of Object.entries(instance.data)) {
      if (!((key.endsWith("_pin") || key === "pin") && typeof value === "string" && value !== "")) {
        continue;
      }

      const strippedPin = value.replace(/^[!^~]*/, "");

      // Skip virtual endstops and reserved pins
      if (isVirtualEndstop(strippedPin) || isReservedPin(strippedPin)) {
        continue;
      }

      // Extract MCU prefix if present
      const colonIdx = strippedPin.indexOf(":");
      let mcuPrefix = "";
      let pinName = strippedPin;

      if (colonIdx !== -1) {
        mcuPrefix = strippedPin.slice(0, colonIdx);
        pinName = strippedPin.slice(colonIdx + 1);
      }

      // Resolve through document-level board_pins aliases
      const resolvedPin = resolvePinAlias(strippedPin, boardAliases);
      const resolvedPinName = colonIdx !== -1 ? resolvedPin.slice(resolvedPin.indexOf(":") + 1) : resolvedPin;

      // Check if the resolved pin is itself an alias in any board_pins section
      const isDocAlias = boardAliases.some((ba) => pinName in ba.aliases);

      // Format check
      if (!matchesKnownPinFormat(resolvedPinName) && !isDocAlias) {
        errors.push({
          section: header,
          field: key,
          message: `Pin "${strippedPin}" does not match any known pin format`,
          severity: "warning",
        });
      }

      // Board membership check (when boards provided)
      if (options?.boards && options.boards.length > 0) {
        const targetAlias = mcuPrefix || "";
        const board = options.boards.find((b) => b.alias === targetAlias);

        if (board) {
          const pinOnBoard =
            board.pins.includes(resolvedPinName) ||
            Object.values(board.aliases).includes(resolvedPinName) ||
            resolvedPinName in board.aliases ||
            pinName in board.aliases;

          if (!pinOnBoard && matchesKnownPinFormat(resolvedPinName)) {
            errors.push({
              section: header,
              field: key,
              message: `Pin "${strippedPin}" is not available on board "${board.mcu}"`,
              severity: "error",
            });
          }
        } else if (mcuPrefix !== "") {
          errors.push({
            section: header,
            field: key,
            message: `No board configured for MCU alias "${mcuPrefix}"`,
            severity: "warning",
          });
        }
      }
    }
  }

  // TMC driver cross-validation
  const tmcPrefixes = ["tmc2209", "tmc5160", "tmc2130", "tmc2208", "tmc2240", "tmc2660"];

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    const def = registry.get(instance.definitionId);
    if (!def || def.naming.kind !== "named") continue;

    if (!tmcPrefixes.includes(instance.definitionId)) continue;

    const targetHeader = instance.instanceName;
    if (targetHeader && !headers.has(targetHeader)) {
      errors.push({
        section: resolveHeader(instance, registry),
        message: `References non-existent section: [${targetHeader}]`,
      });
    }
  }

  // Steppers/extruders without TMC drivers
  const tmcTargets = new Set(
    doc.sections
      .filter((s) => !s.disabled && tmcPrefixes.includes(s.definitionId))
      .map((s) => s.instanceName)
      .filter(Boolean),
  );

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    if (instance.definitionId !== "stepper" && instance.definitionId !== "extruder") continue;
    const header = resolveHeader(instance, registry);
    if (!tmcTargets.has(header)) {
      errors.push({
        section: header,
        message: `No TMC stepper driver configured for [${header}]`,
        severity: "warning",
      });
    }
  }

  // Override conflict detection
  const overrideMap = new Map<string, Map<string, { source: string; value: unknown }>>();

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    const def = registry.get(instance.definitionId);
    if (!def?.overrides) continue;

    const sourceHeader = resolveHeader(instance, registry);
    for (const override of def.overrides) {
      if (!overrideMap.has(override.target)) {
        overrideMap.set(override.target, new Map());
      }
      const targetFields = overrideMap.get(override.target) ?? new Map();
      for (const [field, value] of Object.entries(override.values)) {
        const existing = targetFields.get(field);
        if (existing && existing.value !== value) {
          errors.push({
            section: override.target,
            field,
            message: `Override conflict: "${sourceHeader}" and "${existing.source}" both override "${field}" with different values`,
          });
        }
        targetFields.set(field, { source: sourceHeader, value });
      }
    }
  }

  return errors;
}
