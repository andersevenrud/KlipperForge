import type { ConfigValue } from "@klipperforge/configparser";
import type { z } from "zod";
import type { SectionParams } from "./param-types";

export type { ConfigValue };

export type SectionNaming =
  | { kind: "fixed"; header: string }
  | { kind: "suffixed"; prefix: string }
  | { kind: "named"; prefix: string }
  | { kind: "custom"; header: string };

export interface SectionOverride {
  target: string;
  values: Record<string, ConfigValue>;
}

export interface SectionDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  naming: SectionNaming;
  schema: T;
  params?: SectionParams;
  metaFields?: string[];
  allowedFieldPattern?: RegExp;
  namePattern?: RegExp;
  namePatternMessage?: string;
  overrides?: SectionOverride[];
  order?: number;
  category?: string;
  label?: string;
}

export interface SectionInstance {
  definitionId: string;
  instanceName?: string;
  data: Record<string, ConfigValue>;
  meta?: Record<string, ConfigValue>;
  comments?: Record<string, string>;
  rawText?: string;
  disabled?: boolean;
  file?: string;
}

export interface McuBoardAssociation {
  boardId: string;
  alias: string;
  selectedMcu?: string;
  jumperSelections?: Record<string, string>;
}

export interface SaveConfigSection {
  type: string;
  name: string;
  values: Record<string, ConfigValue>;
}

export interface ImportWarning {
  line: number;
  raw: string;
  message: string;
  file?: string;
  autoFixed?: boolean;
  severity?: "error" | "warning";
}

export interface ConfigDocument {
  sections: SectionInstance[];
  presetId?: string;
  macros?: string[];
  mcuBoards?: McuBoardAssociation[];
  rawSections?: string[];
  saveConfigSections?: SaveConfigSection[];
  files?: string[];
  importWarnings?: ImportWarning[];
}
