import { delayed_gcodeParams } from "../generated/macros";
import { defineSection } from "../schema-from-params";

export const { definition: delayedGcodeDefinition } = defineSection(delayed_gcodeParams, {
  id: "delayed_gcode",
  naming: { kind: "named", prefix: "delayed_gcode" },
  namePattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
  order: 60,
  category: "Macros",
  label: "Delayed G-Code",
});
