export type ConfigValue = string | number | boolean;

export interface IniSection {
  type: string;
  name: string;
  values: Record<string, ConfigValue>;
  comments?: Record<string, string>;
  headerLine?: number;
}

export interface ParseWarning {
  line: number;
  raw: string;
  message: string;
  severity?: "error" | "warning";
}

export interface ParseResult {
  sections: IniSection[];
  warnings: ParseWarning[];
}

export interface ParseOptions {
  /** Accept both "=" and ":" by default */
  delimiters?: string[];
  /** Coerce true/false → boolean, numeric strings → number. Default: true */
  typeCoercion?: boolean;
  /** Lowercase all keys. Default: true */
  lowercaseKeys?: boolean;
  /** "literal" keeps `\` as string value; "drop" removes field + emits warning. Default: "literal" */
  loneBackslash?: "literal" | "drop";
}

export interface SerializeOptions {
  /** Default: ": " */
  delimiter?: string;
  /** Default: "capitalized" → True/False */
  booleanStyle?: "capitalized" | "lowercase" | "uppercase";
  /** Default: "  " (2 spaces) */
  multilineIndent?: string;
  /** Default: "\n" (blank line between sections) */
  sectionSeparator?: string;
}
