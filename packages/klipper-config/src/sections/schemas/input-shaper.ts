import { input_shaperParams } from "../generated/tuning";
import { defineSection } from "../schema-from-params";

export const { schema: inputShaperSchema, definition: inputShaperDefinition } = defineSection(input_shaperParams, {
  id: "input_shaper",
  naming: { kind: "fixed", header: "input_shaper" },
  order: 47,
  category: "Tuning",
  label: "Input Shaper",
});
