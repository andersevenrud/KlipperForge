import { gcode_macroParams } from "../generated/macros";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const gcodeMacroSchema = createSchemaFromParams(gcode_macroParams);

export const gcodeMacroDefinition: SectionDefinition<typeof gcodeMacroSchema> = {
  id: "gcode_macro",
  naming: { kind: "named", prefix: "gcode_macro" },
  schema: gcodeMacroSchema,
  params: gcode_macroParams,
  allowedFieldPattern: /^variable_/,
  namePattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
  order: 60,
  category: "Macros",
  label: "G-Code Macro",
};
