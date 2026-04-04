import { parseIni } from "@klipperforge/configparser";
import type { ImportWarning, McuBoardAssociation, SaveConfigSection } from "./sections/types.js";
import type { ConfigSection } from "./types.js";

export interface ParseResult {
  sections: ConfigSection[];
  mcuBoards: Pick<McuBoardAssociation, "boardId" | "alias">[];
  saveConfigSections?: SaveConfigSection[];
  presetId?: string;
  warnings?: ImportWarning[];
}

interface SectionAnnotation {
  index: number;
  annotation: string;
}

export const COMMENT_SECTION_TYPE = "__comment__";

function normalizeCommentPrefix(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith(";")) return `#${line.slice(1)}`;
      return line;
    })
    .join("\n");
}

function findSectionEnd(lines: string[], headerIdx: number): number {
  let cursor = headerIdx + 1;
  let lastContentLine = headerIdx;

  while (cursor < lines.length) {
    const raw = lines[cursor];
    const trimmed = raw.trim();

    // Next section header — stop
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) break;

    // Blank or comment line — might be end of section content
    if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      cursor++;
      continue;
    }

    // Indented line — continuation
    if (raw.length > 0 && (raw[0] === " " || raw[0] === "\t")) {
      lastContentLine = cursor;
      cursor++;
      continue;
    }

    // Key-value line
    lastContentLine = cursor;
    cursor++;
  }

  return lastContentLine + 1;
}

function splitAtBlankLines(commentLines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of commentLines) {
    if (line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
}

function emitCommentBlocks(commentLines: string[], result: ConfigSection[], commentIndex: { value: number }): void {
  const blocks = splitAtBlankLines(commentLines);
  for (const block of blocks) {
    const text = block.join("\n").trim();
    if (text) {
      result.push({
        type: COMMENT_SECTION_TYPE,
        name: `${COMMENT_SECTION_TYPE}_${commentIndex.value++}`,
        values: {},
        rawText: normalizeCommentPrefix(text),
      });
    }
  }
}

function interleaveCommentSections(lines: string[], sections: ConfigSection[]): ConfigSection[] {
  const result: ConfigSection[] = [];
  const commentIndex = { value: 0 };
  let cursor = 0;

  for (const section of sections) {
    const headerIdx = (section.headerLine ?? 1) - 1; // 0-based index

    // Extract and split comment blocks between cursor and this section's header
    if (headerIdx > cursor) {
      emitCommentBlocks(lines.slice(cursor, headerIdx), result, commentIndex);
    }

    result.push(section);

    // Advance cursor past this section's content
    cursor = findSectionEnd(lines, headerIdx);
  }

  // Trailing comments after last section
  if (cursor < lines.length) {
    emitCommentBlocks(lines.slice(cursor), result, commentIndex);
  }

  return result;
}

export function parseKlipperConfig(text: string): ConfigSection[];
export function parseKlipperConfig(text: string, options: { extended: true }): ParseResult;
export function parseKlipperConfig(text: string, options?: { extended: true }): ConfigSection[] | ParseResult {
  // --- Pre-process: split SAVE_CONFIG, extract annotations and preset ID ---

  const rawLines = text.split("\n");
  let saveConfigStart = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].startsWith("#*# <") && rawLines[i].includes("SAVE_CONFIG")) {
      saveConfigStart = i;
      break;
    }
  }

  const mainLines = saveConfigStart === -1 ? rawLines : rawLines.slice(0, saveConfigStart);
  const saveConfigLines = saveConfigStart === -1 ? [] : rawLines.slice(saveConfigStart + 1);

  // Extract klipperforge annotations from section headers and preset ID
  const annotations: SectionAnnotation[] = [];
  const headerAnnotations = new Map<string, string>();
  let sectionIndex = 0;
  let presetId: string | undefined;
  const cleanedLines: string[] = [];

  for (const line of mainLines) {
    // Check for preset ID in comments — don't include in cleanedLines (metadata only)
    if (line.startsWith("# klipperforge:printer:")) {
      presetId = line.slice("# klipperforge:printer:".length);
      continue;
    }

    // Check for header-block annotation (new format: # klipperforge:[section]:value) — metadata only
    const headerAnnoMatch = line.match(/^# klipperforge:\[(.+?)\]:(.+)$/);
    if (headerAnnoMatch) {
      headerAnnotations.set(headerAnnoMatch[1], headerAnnoMatch[2]);
      continue;
    }

    // Check for section header with inline klipperforge annotation (legacy format)
    const annoMatch = line.match(/^\[(.+?)\]\s*#\s*klipperforge:(.+)$/);
    if (annoMatch) {
      annotations.push({ index: sectionIndex, annotation: annoMatch[2].trim() });
      cleanedLines.push(`[${annoMatch[1]}]`);
      sectionIndex++;
      continue;
    }

    // Track plain section headers for index counting
    if (/^\[.+?\]\s*$/.test(line.trim()) && line.trim().startsWith("[")) {
      const trimmed = line.trim();
      if (/^\[.+?\]$/.test(trimmed)) {
        sectionIndex++;
      }
    }

    cleanedLines.push(line);
  }

  // --- Parse main body ---

  const mainResult = parseIni(cleanedLines.join("\n"), { loneBackslash: "drop" });

  // Interleave comment blocks between parsed sections
  const parsedSections = mainResult.sections as ConfigSection[];
  const sections = interleaveCommentSections(cleanedLines, parsedSections);

  // Map warnings from parseIni early so the empty-value pass can append to the same array
  const warnings: ImportWarning[] = mainResult.warnings.map((w) => ({
    line: w.line,
    raw: w.raw,
    message: w.message,
    ...(w.severity && { severity: w.severity }),
  }));

  // Zip inline annotations back onto parsed sections (legacy format)
  // Use parsedSections (without comment sections) for index-based matching
  for (const anno of annotations) {
    if (anno.index < parsedSections.length) {
      parsedSections[anno.index].annotation = anno.annotation;
    }
  }

  // Apply header-block annotations to sections by matching full header name
  for (const section of sections) {
    if (section.type === COMMENT_SECTION_TYPE) continue;
    const fullHeader = section.type === section.name ? section.type : `${section.type} ${section.name}`;
    const headerAnno = headerAnnotations.get(fullHeader);
    if (headerAnno && !section.annotation) {
      section.annotation = headerAnno;
    }
  }

  // Extract MCU board associations from annotated mcu sections
  const mcuBoards: Pick<McuBoardAssociation, "boardId" | "alias">[] = [];
  for (const section of sections) {
    if (section.type === COMMENT_SECTION_TYPE) continue;
    if (section.annotation && section.type === "mcu") {
      const alias = section.type === section.name ? "" : section.name;
      mcuBoards.push({ boardId: section.annotation, alias });
    }
  }

  // Also extract MCU boards from header annotations for sections not present in the config
  for (const [header, annotation] of headerAnnotations) {
    if ((header === "mcu" || header.startsWith("mcu ")) && !annotation.startsWith("board-aliases:")) {
      const alreadyFound = mcuBoards.some((b) => {
        const existing = b.alias === "" ? "mcu" : `mcu ${b.alias}`;
        return existing === header;
      });
      if (!alreadyFound) {
        const alias = header === "mcu" ? "" : header.slice(4);
        mcuBoards.push({ boardId: annotation, alias });
      }
    }
  }

  // --- Parse SAVE_CONFIG block ---

  let saveConfigSections: SaveConfigSection[] | undefined;

  if (saveConfigLines.length > 0) {
    // Strip #*# prefix from each line, skip lines without it
    const strippedLines: string[] = [];
    for (const line of saveConfigLines) {
      if (!line.startsWith("#*#")) continue;
      strippedLines.push(line.startsWith("#*# ") ? line.slice(4) : line.slice(3));
    }

    const saveResult = parseIni(strippedLines.join("\n"));

    if (saveResult.sections.length > 0) {
      saveConfigSections = saveResult.sections.map((s) => {
        const converted: SaveConfigSection = {
          type: s.type,
          name: s.name,
          values: { ...s.values },
        };

        // Restore leading newline on multiline values (SAVE_CONFIG uses
        // empty-value-then-tab-continuation, so the first continuation
        // should be preceded by a newline to match Klipper's format)
        for (const [key, value] of Object.entries(converted.values)) {
          if (typeof value === "string" && value.includes("\n")) {
            converted.values[key] = `\n${value}`;
          }
        }

        return converted;
      });
    }
  }

  // --- Return ---

  if (options?.extended) {
    return {
      sections,
      mcuBoards,
      saveConfigSections,
      presetId,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
  return sections;
}
