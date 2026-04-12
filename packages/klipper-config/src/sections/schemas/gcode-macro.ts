import { gcode_macroParams } from "../generated/macros";
import { defineSection } from "../schema-from-params";

export const { definition: gcodeMacroDefinition } = defineSection(gcode_macroParams, {
  id: "gcode_macro",
  naming: { kind: "named", prefix: "gcode_macro" },
  allowedFieldPattern: /^variable_/,
  namePattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
  order: 60,
  category: "Macros",
  label: "G-Code Macro",
});
