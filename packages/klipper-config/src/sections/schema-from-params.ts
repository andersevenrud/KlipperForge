import { z } from "zod";
import type { ParamType, SectionParams } from "./param-types";

function zodTypeForParam(paramType: ParamType): z.ZodTypeAny {
  switch (paramType.kind) {
    case "string":
      return z.string();
    case "number": {
      let schema = z.number();
      if (paramType.min !== undefined) schema = schema.min(paramType.min);
      if (paramType.max !== undefined) schema = schema.max(paramType.max);
      if (paramType.above !== undefined) schema = schema.gt(paramType.above);
      if (paramType.below !== undefined) schema = schema.lt(paramType.below);
      if (paramType.integer) schema = schema.int();
      return schema;
    }
    case "boolean":
      return z.boolean();
    case "choice": {
      const allNumeric = paramType.choices.every((c) => !Number.isNaN(Number(c)));
      if (allNumeric) {
        return z.union([z.enum(paramType.choices as [string, ...string[]]), z.number()]);
      }
      return z.enum(paramType.choices as [string, ...string[]]);
    }
    case "multiline":
      return z.string();
    case "list":
      return z.string();
  }
}

export function createSchemaFromParams(params: SectionParams) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, param] of Object.entries(params)) {
    const base = zodTypeForParam(param.type);
    if (param.required && (param.type.kind === "string" || param.type.kind === "multiline")) {
      shape[key] = (base as z.ZodString).min(1, `${key} is required`);
    } else {
      shape[key] = param.required ? base : base.optional();
    }
  }

  return z.object(shape).passthrough();
}
