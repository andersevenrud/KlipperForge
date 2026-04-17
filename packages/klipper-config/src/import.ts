import type { ParseResult } from "./parser";
import { COMMENT_SECTION_TYPE, parseKlipperConfig } from "./parser";
import { parsePinAliasString } from "./pins";
import { computeHiddenFields } from "./sections/normalize";
import { getMetaFieldSet, type SectionRegistry } from "./sections/registry";
import { isBoardPinsSection } from "./sections/schemas/board-pins";
import { getSectionModeConfig } from "./sections/section-modes";
import type {
  ConfigDocument,
  ConfigValue,
  ImportWarning,
  McuBoardAssociation,
  SaveConfigSection,
  SectionInstance,
} from "./sections/types";
import type { ConfigSection } from "./types";

export function cfgToDocument(
  sections: ConfigSection[],
  mcuBoards: Pick<McuBoardAssociation, "boardId" | "alias" | "jumperSelections">[],
  registry: SectionRegistry,
  saveConfigSections?: SaveConfigSection[],
  presetId?: string,
  warnings?: ImportWarning[],
): ConfigDocument {
  const allDefs = registry.all();

  // Build lookup maps for matching
  const fixedMap = new Map<string, string>(); // header → definitionId
  const namedMap = new Map<string, string>(); // prefix → definitionId
  const suffixedMap = new Map<string, string>(); // prefix → definitionId

  for (const def of allDefs) {
    switch (def.naming.kind) {
      case "fixed":
      case "custom":
        fixedMap.set(def.naming.header, def.id);
        break;
      case "named":
        namedMap.set(def.naming.prefix, def.id);
        break;
      case "suffixed":
        suffixedMap.set(def.naming.prefix, def.id);
        break;
    }
  }

  const result: ConfigDocument = {
    sections: [],
    presetId,
    mcuBoards: mcuBoards.length > 0 ? mcuBoards : undefined,
    rawSections: [],
  };

  for (const section of sections) {
    // Pass through comment sections as-is
    if (section.type === COMMENT_SECTION_TYPE) {
      result.sections.push({
        definitionId: COMMENT_SECTION_TYPE,
        instanceName: section.name,
        data: {},
        rawText: section.rawText,
      });
      continue;
    }

    const fullHeader = section.type === section.name ? section.type : `${section.type} ${section.name}`;

    // Try exact match for fixed/custom definitions
    let definitionId = fixedMap.get(fullHeader);
    let instanceName: string | undefined;

    if (!definitionId) {
      // Try named match: "type name" → prefix match on type
      definitionId = namedMap.get(section.type);
      if (definitionId && section.type !== section.name) {
        instanceName = section.name.startsWith(`${section.type} `)
          ? section.name.substring(section.type.length + 1)
          : section.name !== section.type
            ? section.name
            : undefined;
      }
    }

    if (!definitionId) {
      // Try suffixed match: "prefix_suffix" pattern on the full name
      for (const [prefix, defId] of suffixedMap) {
        if (section.name.startsWith(`${prefix}_`)) {
          definitionId = defId;
          instanceName = section.name.substring(prefix.length + 1);
          break;
        }
      }
    }

    if (definitionId) {
      const def = registry.get(definitionId);
      const data: Record<string, ConfigValue> = {};
      for (const [key, value] of Object.entries(section.values)) {
        if (typeof value === "string" && value.startsWith("\n") && def?.params?.[key]?.type.kind === "multiline") {
          data[key] = value.slice(1);
        } else {
          data[key] = value;
        }
      }

      // Drop empty string values (but preserve multiline fields where empty is valid)
      if (warnings) {
        for (const key of Object.keys(data)) {
          if (data[key] === "") {
            const isMultiline = def?.params?.[key]?.type.kind === "multiline";
            if (!isMultiline) {
              warnings.push({
                line: 0,
                raw: `${key}:`,
                message: `Empty value for "${key}" in [${fullHeader}] — field removed`,
              });
              delete data[key];
            }
          }
        }
      }

      // Detect unknown fields
      if (warnings && def?.params) {
        const metaFields = getMetaFieldSet(def);
        for (const key of Object.keys(section.values)) {
          if (!def.params[key] && !metaFields.has(key) && !def.allowedFieldPattern?.test(key)) {
            warnings.push({
              line: 0,
              raw: `${key}: ${section.values[key]}`,
              message: `Unknown option "${key}" in [${fullHeader}] — Klipper does not recognize this field`,
            });
          }
        }
      }

      const instance: SectionInstance = {
        definitionId,
        data,
      };
      if (instanceName) {
        instance.instanceName = instanceName;
        if (warnings && def?.namePattern && !def.namePattern.test(instanceName)) {
          const hint = def.namePatternMessage ?? "only letters, digits, and underscores are allowed";
          warnings.push({
            line: 0,
            raw: `[${fullHeader}]`,
            message: `Invalid name "${instanceName}" in [${fullHeader}] — ${hint.toLowerCase()}`,
            severity: "error",
          });
        }
      }
      if (section.comments && Object.keys(section.comments).length > 0) {
        instance.comments = { ...section.comments };
      }
      if (section.annotation?.startsWith("board-aliases:") && isBoardPinsSection(definitionId)) {
        instance.meta = {
          _boardSource: section.annotation.slice("board-aliases:".length),
        };
      }
      // Normalize board_pins aliases to one-per-line format
      if (isBoardPinsSection(definitionId)) {
        for (const key of Object.keys(instance.data)) {
          if ((key === "aliases" || key.startsWith("aliases_")) && typeof instance.data[key] === "string") {
            const parsed = parsePinAliasString(instance.data[key] as string);
            const entries = Object.entries(parsed);
            if (entries.length > 0) {
              instance.data[key] = entries.map(([name, pin]) => `${name}=${pin}`).join(",\n");
            }
          }
        }
      }
      result.sections.push(instance);
    } else {
      // Drop empty string values from unmatched sections
      if (warnings) {
        for (const key of Object.keys(section.values)) {
          if (section.values[key] === "") {
            warnings.push({
              line: 0,
              raw: `${key}:`,
              message: `Empty value for "${key}" in [${fullHeader}] — field removed`,
            });
            delete section.values[key];
          }
        }
      }

      // Unmatched → raw section
      const lines = [`[${fullHeader}]`];
      for (const [key, value] of Object.entries(section.values)) {
        const comment = section.comments?.[key];
        const suffix = comment ? ` # ${comment}` : "";
        lines.push(`${key}: ${formatRawValue(value)}${suffix}`);
      }
      result.rawSections?.push(lines.join("\n"));
    }
  }

  // Clean up empty arrays
  if (result.rawSections?.length === 0) {
    result.rawSections = undefined;
  }

  if (saveConfigSections && saveConfigSections.length > 0) {
    result.saveConfigSections = saveConfigSections;
  }

  // Detect mode and warn about conflicting fields (preserved in data, filtered at serialization)
  if (warnings) {
    for (const section of result.sections) {
      const modeConfig = getSectionModeConfig(section.definitionId);
      if (!modeConfig) continue;

      const detectedMode = modeConfig.detect(section.data);
      section.meta = { ...section.meta, _mode: detectedMode };

      const hiddenFields = modeConfig.getHiddenFields(detectedMode);
      const conflictingFields = [...hiddenFields].filter((field) => section.data[field] !== undefined);

      if (conflictingFields.length > 0) {
        const def = registry.get(section.definitionId);
        const sectionHeader =
          def?.naming.kind === "fixed" || def?.naming.kind === "custom"
            ? def.naming.header
            : section.instanceName
              ? `${section.definitionId} ${section.instanceName}`
              : section.definitionId;
        warnings.push({
          line: 0,
          raw: conflictingFields.join(", "),
          message: `[${sectionHeader}] has conflicting fields — ${conflictingFields.join(", ")} won't be output (${detectedMode} mode detected)`,
        });
      }
    }
  }

  // Lint: warn about fields that have no effect due to visibility rules
  if (warnings) {
    for (const section of result.sections) {
      const def = registry.get(section.definitionId);
      if (!def?.params) continue;
      const hidden = computeHiddenFields(def.params, section.definitionId, section.data);
      for (const [field, reason] of hidden) {
        if (section.data[field] === undefined) continue;
        const sectionHeader =
          def.naming.kind === "fixed" || def.naming.kind === "custom"
            ? def.naming.header
            : section.instanceName
              ? `${section.definitionId} ${section.instanceName}`
              : section.definitionId;
        warnings.push({
          line: 0,
          raw: `${field}: ${section.data[field]}`,
          message: `[${sectionHeader}] ${reason}`,
        });
      }
    }
  }

  if (warnings && warnings.length > 0) {
    result.importWarnings = warnings;
  }

  return result;
}

function formatRawValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

export function parseMultiFileConfigs(
  files: { name: string; content: string }[],
  registry: SectionRegistry,
): ConfigDocument {
  if (files.length === 0) {
    return { sections: [] };
  }

  // Parse each file
  const parsed = files.map((f) => ({
    name: f.name,
    result: parseKlipperConfig(f.content, { extended: true }) as ParseResult,
  }));

  // Determine main file: file with [include] directives, or "printer.cfg", or first
  let mainFileName = files[0].name;
  const fileWithIncludes = parsed.find((p) => p.result.sections.some((s) => s.type === "include"));
  if (fileWithIncludes) {
    mainFileName = fileWithIncludes.name;
  } else {
    const printerCfg = parsed.find((p) => p.name === "printer.cfg" || p.name.endsWith("/printer.cfg"));
    if (printerCfg) {
      mainFileName = printerCfg.name;
    }
  }

  // Extract file order from [include] directives in the main file
  const mainParsed = parsed.find((p) => p.name === mainFileName);
  const includeOrder = mainParsed
    ? mainParsed.result.sections.filter((s) => s.type === "include").map((s) => s.name)
    : [];

  // Build ordered file list: main first, then includes in order, then any remaining
  const fileOrder = [mainFileName];
  for (const inc of includeOrder) {
    const match = parsed.find((p) => p.name === inc || p.name.endsWith(`/${inc}`));
    if (match && !fileOrder.includes(match.name)) {
      fileOrder.push(match.name);
    }
  }
  for (const p of parsed) {
    if (!fileOrder.includes(p.name)) {
      fileOrder.push(p.name);
    }
  }

  // Merge all sections into one document
  const allSections: SectionInstance[] = [];
  let presetId: string | undefined;
  let mcuBoards: Pick<McuBoardAssociation, "boardId" | "alias" | "jumperSelections">[] = [];
  let saveConfigSections: SaveConfigSection[] | undefined;
  const rawSections: string[] = [];
  const allWarnings: ImportWarning[] = [];

  for (const { name, result } of parsed) {
    const isMain = name === mainFileName;

    // Collect parse warnings with file attribution
    if (result.warnings) {
      for (const w of result.warnings) {
        allWarnings.push({ ...w, file: name });
      }
    }

    const fileWarnings: ImportWarning[] = [];
    const doc = cfgToDocument(
      result.sections,
      result.mcuBoards,
      registry,
      result.saveConfigSections,
      result.presetId,
      fileWarnings,
    );

    // Tag unknown-field warnings with file
    for (const w of fileWarnings) {
      allWarnings.push({ ...w, file: name });
    }

    // Tag each section with its file
    for (const section of doc.sections) {
      section.file = name;
      allSections.push(section);
    }

    // Collect metadata from main file
    if (isMain) {
      presetId = doc.presetId;
      if (doc.mcuBoards) mcuBoards = doc.mcuBoards;
      if (doc.saveConfigSections) saveConfigSections = doc.saveConfigSections;
    }
    if (doc.rawSections) {
      rawSections.push(...doc.rawSections);
    }
  }

  return {
    sections: allSections,
    files: fileOrder,
    presetId,
    mcuBoards: mcuBoards.length > 0 ? mcuBoards : undefined,
    rawSections: rawSections.length > 0 ? rawSections : undefined,
    saveConfigSections,
    importWarnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}
