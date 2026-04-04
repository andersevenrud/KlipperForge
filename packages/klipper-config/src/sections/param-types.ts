export type ParamType =
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

export interface ParamVisibilityCondition {
  field: string;
  value: string | number | boolean;
}

export interface ParamDefinition {
  type: ParamType;
  description: string;
  required: boolean;
  default?: string | number | boolean;
  visibleWhen?: ParamVisibilityCondition;
  hiddenWhen?: ParamVisibilityCondition;
}

export type SectionParams = Record<string, ParamDefinition>;
