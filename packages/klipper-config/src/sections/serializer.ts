import { formatMultilineValue, formatValue } from "@klipperforge/configparser";
import { COMMENT_SECTION_TYPE } from "../parser";
import { computeHiddenFields } from "./normalize";
import { resolveHeader, type SectionRegistry } from "./registry";
import { isBoardPinsSection } from "./schemas/board-pins";
import { getSectionModeConfig } from "./section-modes";
import type { ConfigDocument, ConfigValue, SaveConfigSection, SectionInstance } from "./types";

export interface DefaultMatch {
  section: string;
  field: string;
  value: ConfigValue;
}

export interface MultiFileOutput {
  files: Map<string, string>;
  sourceMaps: Map<string, ConfigSourceMap>;
  defaultMatches: DefaultMatch[];
}

export interface ConfigSourceMap {
  sectionLines: Map<string, number>;
  fieldLines: Map<string, number>;
  rawSectionLines: number[];
}

export const SAVE_CONFIG_HEADER_PREFIX = "#*# ";

function joinSectionBlocks(blocks: string[]): string {
  const result: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    result.push(blocks[i]);
    if (i < blocks.length - 1) {
      const currentIsInclude = blocks[i].startsWith("[include ");
      const nextIsInclude = blocks[i + 1].startsWith("[include ");
      result.push(currentIsInclude && nextIsInclude ? "\n" : "\n\n");
    }
  }
  return result.join("");
}

function serializeSaveConfigBlock(sections: SaveConfigSection[]): string {
  const lines: string[] = [
    "#*# <---------------------- SAVE_CONFIG ---------------------->",
    "#*# DO NOT EDIT THIS BLOCK OR BELOW. The contents are auto-generated.",
    "#*#",
  ];
  for (const section of sections) {
    const fullHeader = section.type === section.name ? section.type : `${section.type} ${section.name}`;
    lines.push(`#*# [${fullHeader}]`);
    for (const [key, value] of Object.entries(section.values)) {
      const formatted = formatValue(value);
      if (formatted.includes("\n")) {
        lines.push(`#*# ${key} =`);
        for (const part of formatted.split("\n")) {
          lines.push(`#*# \t${part}`);
        }
      } else {
        lines.push(`#*# ${key} = ${formatted}`);
      }
    }
    lines.push("#*#");
  }
  return lines.join("\n");
}

export interface SerializeOptions {
  header?: string;
  secondaryHeader?: string;
  omitDefaults?: boolean;
}

function buildAnnotationLines(doc: ConfigDocument, instances: SectionInstance[], registry: SectionRegistry): string[] {
  const lines: string[] = [];

  if (doc.mcuBoards) {
    for (const entry of doc.mcuBoards) {
      const mcuHeader = entry.alias === "" ? "mcu" : `mcu ${entry.alias}`;
      lines.push(`# klipperforge:[${mcuHeader}]:${entry.boardId}`);
      if (entry.jumperSelections) {
        for (const [name, label] of Object.entries(entry.jumperSelections)) {
          lines.push(`# klipperforge:[jumpers:${entry.boardId}]:${name}=${label}`);
        }
      }
    }
  }

  for (const instance of instances) {
    const boardSource = typeof instance.meta?._boardSource === "string" ? instance.meta._boardSource : undefined;
    if (boardSource) {
      const header = resolveHeader(instance, registry);
      if (header) {
        lines.push(`# klipperforge:[${header}]:board-aliases:${boardSource}`);
      }
    }
  }

  return lines;
}

function buildFullHeader(options: SerializeOptions | undefined, annotationLines: string[]): string {
  if (!options?.header) return "";
  const parts: string[] = [options.header];
  if (annotationLines.length > 0) parts.push(annotationLines.join("\n"));
  return parts.join("\n");
}

export function serializeConfig(doc: ConfigDocument, registry: SectionRegistry, options?: SerializeOptions): string {
  const instances = doc.sections.map((s) => ({
    ...s,
    data: { ...s.data },
  }));

  // Collect and apply overrides (skip disabled sections)
  for (const instance of instances) {
    if (instance.disabled) continue;
    const def = registry.get(instance.definitionId);
    if (!def?.overrides) continue;

    for (const override of def.overrides) {
      const target = instances.find((inst) => {
        const header = resolveHeader(inst, registry);
        return header === override.target;
      });
      if (target) {
        Object.assign(target.data, override.values);
      }
    }
  }

  const sections: string[] = [];

  for (const instance of instances) {
    // Comment sections — output raw text as-is
    if (instance.definitionId === COMMENT_SECTION_TYPE) {
      if (instance.rawText) {
        sections.push(instance.rawText);
      }
      continue;
    }

    const header = resolveHeader(instance, registry);
    if (!header) continue;

    const def = registry.get(instance.definitionId);
    const metaFields = new Set(def?.metaFields ?? []);

    const modeConfig = getSectionModeConfig(instance.definitionId);
    const sectionMode = modeConfig ? ((instance.meta?._mode as string) ?? modeConfig.detect(instance.data)) : undefined;
    const hiddenFields = def?.params
      ? computeHiddenFields(def.params, instance.definitionId, instance.data, sectionMode)
      : undefined;

    const lines: string[] = [`[${header}]`];
    for (const [key, value] of Object.entries(instance.data)) {
      if (value === undefined || (typeof value === "number" && Number.isNaN(value))) continue;
      if (metaFields.has(key)) continue;
      if (hiddenFields?.has(key)) continue;

      const paramDef = def?.params?.[key];
      if (options?.omitDefaults && paramDef?.default !== undefined && value === paramDef.default) continue;

      const isMultiline = paramDef?.type.kind === "multiline";
      const formatted = formatValue(value);
      const comment = instance.comments?.[key];
      const suffix = comment ? ` # ${comment}` : "";

      if (isMultiline && formatted.includes("\n")) {
        const trimmed = formatted.replace(/^\n/, "");
        const indented = formatMultilineValue(trimmed, "    ");
        lines.push(`${key}:\n${indented}`);
      } else {
        lines.push(`${key}: ${formatted}${suffix}`);
      }
    }
    if (instance.disabled) {
      sections.push(lines.map((line) => `# ${line}`).join("\n"));
    } else {
      sections.push(lines.join("\n"));
    }
  }

  if (doc.rawSections) {
    for (const raw of doc.rawSections) {
      sections.push(raw);
    }
  }

  if (doc.saveConfigSections && doc.saveConfigSections.length > 0) {
    sections.push(serializeSaveConfigBlock(doc.saveConfigSections));
  }

  const body = `${joinSectionBlocks(sections)}\n`;
  const annotationLines = buildAnnotationLines(doc, instances, registry);
  const fullHeader = buildFullHeader(options, annotationLines);
  return fullHeader ? `${fullHeader}\n\n${body}` : body;
}

export function serializeConfigWithSourceMap(
  doc: ConfigDocument,
  registry: SectionRegistry,
  options?: SerializeOptions,
): { text: string; sourceMap: ConfigSourceMap; defaultMatches: DefaultMatch[] } {
  const instances = doc.sections.map((s) => ({
    ...s,
    data: { ...s.data },
  }));

  for (const instance of instances) {
    if (instance.disabled) continue;
    const def = registry.get(instance.definitionId);
    if (!def?.overrides) continue;

    for (const override of def.overrides) {
      const target = instances.find((inst) => {
        const header = resolveHeader(inst, registry);
        return header === override.target;
      });
      if (target) {
        Object.assign(target.data, override.values);
      }
    }
  }

  const sourceMap: ConfigSourceMap = {
    sectionLines: new Map(),
    fieldLines: new Map(),
    rawSectionLines: [],
  };

  const defaultMatches: DefaultMatch[] = [];
  const sectionBlocks: string[] = [];
  // Account for header + annotation lines if present (+ blank line separator)
  const annotationLines = buildAnnotationLines(doc, instances, registry);
  const headerTextLineCount = options?.header ? options.header.split("\n").length : 0;
  const totalPrefixLines = headerTextLineCount + annotationLines.length;
  const headerLineCount = totalPrefixLines > 0 ? totalPrefixLines + 1 : 0;
  let lineNumber = 1 + headerLineCount;

  for (const instance of instances) {
    // Comment sections — output raw text, advance line count
    if (instance.definitionId === COMMENT_SECTION_TYPE) {
      if (instance.rawText) {
        if (sectionBlocks.length > 0) {
          lineNumber++; // blank line before comment block
        }
        const commentHeader = instance.instanceName ?? COMMENT_SECTION_TYPE;
        sourceMap.sectionLines.set(commentHeader, lineNumber);
        const commentLines = instance.rawText.split("\n");
        lineNumber += commentLines.length;
        sectionBlocks.push(instance.rawText);
      }
      continue;
    }

    const header = resolveHeader(instance, registry);
    if (!header) continue;

    const def = registry.get(instance.definitionId);
    const metaFields = new Set(def?.metaFields ?? []);

    if (sectionBlocks.length > 0) {
      const prevIsInclude = sectionBlocks[sectionBlocks.length - 1].startsWith("[include ");
      const currentIsInclude = header.startsWith("include ");
      if (!(prevIsInclude && currentIsInclude)) {
        lineNumber++; // blank line between sections (skipped for consecutive includes)
      }
    }

    sourceMap.sectionLines.set(header, lineNumber);

    const modeConfig = getSectionModeConfig(instance.definitionId);
    const sectionMode = modeConfig ? ((instance.meta?._mode as string) ?? modeConfig.detect(instance.data)) : undefined;
    const hiddenFields = def?.params
      ? computeHiddenFields(def.params, instance.definitionId, instance.data, sectionMode)
      : undefined;

    const lines: string[] = [`[${header}]`];
    lineNumber++;

    for (const [key, value] of Object.entries(instance.data)) {
      if (value === undefined || (typeof value === "number" && Number.isNaN(value))) continue;
      if (metaFields.has(key)) continue;
      if (hiddenFields?.has(key)) continue;

      const paramDef = def?.params?.[key];
      if (paramDef?.default !== undefined && value === paramDef.default) {
        defaultMatches.push({ section: header, field: key, value });
        if (options?.omitDefaults) continue;
      }

      sourceMap.fieldLines.set(`${header}::${key}`, lineNumber);

      const isMultiline = paramDef?.type.kind === "multiline";
      const formatted = formatValue(value);
      const comment = instance.comments?.[key];
      const suffix = comment ? ` # ${comment}` : "";

      if (isMultiline && formatted.includes("\n")) {
        const trimmed = formatted.replace(/^\n/, "");
        const indented = formatMultilineValue(trimmed, "    ");
        lines.push(`${key}:\n${indented}`);
        // Add per-line source map entries for board_pins aliases
        const isBoardPinsAlias =
          isBoardPinsSection(instance.definitionId) && (key === "aliases" || key.startsWith("aliases_"));
        if (isBoardPinsAlias) {
          const aliasLines = trimmed.split("\n");
          for (let i = 0; i < aliasLines.length; i++) {
            const eqIdx = aliasLines[i].indexOf("=");
            if (eqIdx > 0) {
              const aliasName = aliasLines[i].slice(0, eqIdx).trim();
              sourceMap.fieldLines.set(`${header}::${key}.${aliasName}`, lineNumber + 1 + i);
            }
          }
        }
        lineNumber += 1 + trimmed.split("\n").length;
      } else {
        lines.push(`${key}: ${formatted}${suffix}`);
        lineNumber++;
      }
    }
    if (instance.disabled) {
      sectionBlocks.push(lines.map((line) => `# ${line}`).join("\n"));
    } else {
      sectionBlocks.push(lines.join("\n"));
    }
  }

  if (doc.rawSections) {
    for (const raw of doc.rawSections) {
      if (sectionBlocks.length > 0) {
        lineNumber++;
      }
      sourceMap.rawSectionLines.push(lineNumber);
      const blockLines = raw.split("\n");
      lineNumber += blockLines.length;
      sectionBlocks.push(raw);
    }
  }

  if (doc.saveConfigSections && doc.saveConfigSections.length > 0) {
    if (sectionBlocks.length > 0) {
      lineNumber++; // blank line before SAVE_CONFIG block
    }

    // Skip the 3-line header (marker, warning, blank #*#)
    lineNumber += 3;

    for (const section of doc.saveConfigSections) {
      const fullHeader = section.type === section.name ? section.type : `${section.type} ${section.name}`;
      const mapKey = `${SAVE_CONFIG_HEADER_PREFIX}${fullHeader}`;
      sourceMap.sectionLines.set(mapKey, lineNumber);
      lineNumber++; // #*# [header]

      for (const [key, value] of Object.entries(section.values)) {
        sourceMap.fieldLines.set(`${mapKey}::${key}`, lineNumber);
        const formatted = formatValue(value);
        if (formatted.includes("\n")) {
          lineNumber += 1 + formatted.split("\n").length; // key line + continuation lines
        } else {
          lineNumber++;
        }
      }
      lineNumber++; // trailing #*#
    }

    sectionBlocks.push(serializeSaveConfigBlock(doc.saveConfigSections));
  }

  const body = `${joinSectionBlocks(sectionBlocks)}\n`;
  const fullHeader = buildFullHeader(options, annotationLines);
  return {
    text: fullHeader ? `${fullHeader}\n\n${body}` : body,
    sourceMap,
    defaultMatches,
  };
}

function resolveFileForSection(section: SectionInstance, mainFile: string): string {
  return section.file ?? mainFile;
}

export function serializeMultiFileConfig(
  doc: ConfigDocument,
  registry: SectionRegistry,
  options?: SerializeOptions,
): MultiFileOutput {
  const mainFile = doc.files?.[0] ?? "printer.cfg";
  const allFiles = doc.files ?? [mainFile];

  const result: MultiFileOutput = {
    files: new Map(),
    sourceMaps: new Map(),
    defaultMatches: [],
  };

  // Group sections by file
  const sectionsByFile = new Map<string, SectionInstance[]>();
  for (const file of allFiles) {
    sectionsByFile.set(file, []);
  }
  for (const section of doc.sections) {
    const file = resolveFileForSection(section, mainFile);
    if (!sectionsByFile.has(file)) {
      sectionsByFile.set(file, []);
    }
    const fileSections = sectionsByFile.get(file);
    if (fileSections) {
      fileSections.push(section);
    }
  }

  for (const file of allFiles) {
    const isMain = file === mainFile;
    const fileSections = sectionsByFile.get(file) ?? [];

    const fileDoc: ConfigDocument = {
      sections: fileSections,
      presetId: isMain ? doc.presetId : undefined,
      mcuBoards: isMain ? doc.mcuBoards : undefined,
      rawSections: isMain ? doc.rawSections : undefined,
      saveConfigSections: isMain ? doc.saveConfigSections : undefined,
    };

    const fileOptions = isMain
      ? options
      : options?.secondaryHeader
        ? { ...options, header: options.secondaryHeader, secondaryHeader: undefined }
        : undefined;

    const { text, sourceMap, defaultMatches } = serializeConfigWithSourceMap(fileDoc, registry, fileOptions);
    result.defaultMatches.push(...defaultMatches);

    result.files.set(file, text);
    result.sourceMaps.set(file, sourceMap);
  }

  return result;
}
