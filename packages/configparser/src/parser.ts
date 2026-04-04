import type { ConfigValue, IniSection, ParseOptions, ParseResult, ParseWarning } from "./types";

interface ResolvedParseOptions {
  delimiters: string[];
  typeCoercion: boolean;
  lowercaseKeys: boolean;
  loneBackslash: "literal" | "drop";
}

const DEFAULT_OPTIONS: ResolvedParseOptions = {
  delimiters: [":", "="],
  typeCoercion: true,
  lowercaseKeys: true,
  loneBackslash: "literal",
};

function buildKvRegex(delimiters: string[]): RegExp {
  const escaped = delimiters.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
  return new RegExp(`^([^${escaped}]+)[${escaped}]\\s*(.*)$`);
}

const TRUTHY_VALUES = new Set(["true", "yes", "on"]);
const FALSY_VALUES = new Set(["false", "no", "off"]);

function coerceValue(rawValue: string, typeCoercion: boolean): ConfigValue {
  if (!typeCoercion) return rawValue;

  const lower = rawValue.toLowerCase();
  if (TRUTHY_VALUES.has(lower)) return true;
  if (FALSY_VALUES.has(lower)) return false;
  if (rawValue !== "" && /^-?\d+(\.\d+)?$/.test(rawValue)) return Number(rawValue);
  return rawValue;
}

export function parseIni(text: string, options?: ParseOptions): ParseResult {
  const opts: ResolvedParseOptions = { ...DEFAULT_OPTIONS, ...options };
  const kvRegex = buildKvRegex(opts.delimiters);

  const sections: IniSection[] = [];
  const warnings: ParseWarning[] = [];
  let current: IniSection | null = null;
  let lastKey: string | null = null;
  let lineNumber = 0;

  for (const rawLine of text.split("\n")) {
    lineNumber++;

    // Handle continuation lines (indented lines that belong to the previous key)
    if (current && lastKey && rawLine.length > 0 && (rawLine[0] === " " || rawLine[0] === "\t")) {
      const stripped = rawLine.trimStart();
      // Include all non-empty continuation lines (comments are part of multiline values like gcode)
      if (stripped !== "") {
        const existing = current.values[lastKey];
        current.values[lastKey] = existing === "" ? stripped : `${existing}\n${stripped}`;
      }
      continue;
    }

    const line = rawLine.trim();

    if (line === "" || line.startsWith("#") || line.startsWith(";")) {
      continue;
    }

    // Section header
    const sectionMatch = line.match(/^\[(.+?)\]$/);
    if (sectionMatch) {
      if (current) {
        sections.push(current);
      }
      const fullName = sectionMatch[1];
      const spaceIndex = fullName.indexOf(" ");
      const type = spaceIndex === -1 ? fullName : fullName.substring(0, spaceIndex);
      const name = spaceIndex === -1 ? fullName : fullName.substring(spaceIndex + 1);
      current = { type, name, values: {}, comments: {}, headerLine: lineNumber };
      lastKey = null;
      continue;
    }

    if (current) {
      const kvMatch = line.match(kvRegex);
      if (kvMatch) {
        const key = opts.lowercaseKeys ? kvMatch[1].trim().toLowerCase() : kvMatch[1].trim();
        let rawValue = kvMatch[2].trim();

        // Extract inline comment (value # comment)
        let comment: string | undefined;
        const commentMatch = rawValue.match(/^(.*?)\s+#\s*(.*)$/);
        if (commentMatch) {
          rawValue = commentMatch[1].trim();
          comment = commentMatch[2];
        }

        // Lone backslash handling
        if (rawValue === "\\") {
          if (opts.loneBackslash === "drop") {
            warnings.push({
              line: lineNumber,
              raw: rawLine,
              message: `Value "${key}" is a lone backslash — likely a malformed continuation. Field dropped.`,
            });
            continue;
          }
          // "literal" mode: keep as string "\"
        }

        current.values[key] = coerceValue(rawValue, opts.typeCoercion);

        if (comment !== undefined) {
          if (!current.comments) current.comments = {};
          current.comments[key] = comment;
        }
        lastKey = key;
      } else {
        // Unrecognized line inside a section
        const sectionLabel = current.type !== current.name ? `${current.type} ${current.name}` : current.type;
        const hint = line.startsWith("\\")
          ? " (looks like a malformed continuation — continuations must start with whitespace)"
          : "";
        warnings.push({
          line: lineNumber,
          raw: rawLine,
          message: `Unrecognized line in [${sectionLabel}]${hint}`,
          severity: "error",
        });
      }
    } else {
      // Line outside any section
      warnings.push({
        line: lineNumber,
        raw: rawLine,
        message: "Line outside any section",
        severity: "error",
      });
    }
  }

  if (current) {
    sections.push(current);
  }

  return { sections, warnings };
}
