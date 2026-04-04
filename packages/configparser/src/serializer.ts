import type { ConfigValue, IniSection, SerializeOptions } from "./types";

interface ResolvedSerializeOptions {
  delimiter: string;
  booleanStyle: "capitalized" | "lowercase" | "uppercase";
  multilineIndent: string;
  sectionSeparator: string;
}

const DEFAULT_OPTIONS: ResolvedSerializeOptions = {
  delimiter: ": ",
  booleanStyle: "capitalized",
  multilineIndent: "    ",
  sectionSeparator: "\n",
};

export function formatMultilineValue(value: string, baseIndent: string): string {
  const lines = value.split("\n");
  const indentStep = "    ";
  let depth = 0;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      result.push("");
      continue;
    }

    const isClose = /^\{%-?\s*end/.test(trimmed);
    const isMiddle = /^\{%-?\s*(else|elif)\b/.test(trimmed);

    // Count net brace depth change for dict/list literals,
    // excluding braces inside Jinja tags ({%, %}}, {{, }})
    const stripped = trimmed.replace(/\{[%#{]|[%#}]\}/g, "");
    const openBraces = (stripped.match(/[{[]/g) ?? []).length;
    const closeBraces = (stripped.match(/[}\]]/g) ?? []).length;
    const bracesDelta = openBraces - closeBraces;

    // Dedent before lines that close braces or Jinja blocks
    if (isClose || isMiddle) {
      depth = Math.max(0, depth - 1);
    } else if (bracesDelta < 0) {
      depth = Math.max(0, depth + bracesDelta);
    }

    result.push(`${baseIndent}${indentStep.repeat(depth)}${trimmed}`);

    const isOpen = /^\{%-?\s*(if|for|macro|call|filter|block)\b/.test(trimmed);
    if (isOpen || isMiddle) {
      depth++;
    } else if (bracesDelta > 0) {
      depth += bracesDelta;
    }
  }

  return result.join("\n");
}

export function normalizeValue(value: ConfigValue): ConfigValue {
  if (typeof value !== "string") return value;
  if (/,/.test(value) && /^[\d.\-,\s]+$/.test(value.trim())) {
    return value
      .split(",")
      .map((p) => p.trim())
      .join(", ");
  }
  return value;
}

export function formatValue(value: ConfigValue, options?: Pick<SerializeOptions, "booleanStyle">): string {
  if (typeof value === "boolean") {
    const style = options?.booleanStyle ?? "capitalized";
    if (style === "lowercase") return value ? "true" : "false";
    if (style === "uppercase") return value ? "TRUE" : "FALSE";
    return value ? "True" : "False";
  }
  return String(normalizeValue(value));
}

export function serializeIni(sections: IniSection[], options?: SerializeOptions): string {
  const opts: ResolvedSerializeOptions = { ...DEFAULT_OPTIONS, ...options };
  const blocks: string[] = [];

  for (const section of sections) {
    const header = section.type === section.name ? `[${section.type}]` : `[${section.type} ${section.name}]`;
    const lines: string[] = [header];

    for (const [key, value] of Object.entries(section.values)) {
      const formatted = formatValue(value, { booleanStyle: opts.booleanStyle });
      const comment = section.comments?.[key];
      const suffix = comment ? ` # ${comment}` : "";

      if (formatted.includes("\n")) {
        const indented = formatMultilineValue(formatted, opts.multilineIndent);
        lines.push(`${key}${opts.delimiter}\n${indented}`);
      } else {
        lines.push(`${key}${opts.delimiter}${formatted}${suffix}`);
      }
    }

    blocks.push(lines.join("\n"));
  }

  if (blocks.length === 0) return "";
  return `${blocks.join(`\n${opts.sectionSeparator}`)}\n`;
}
