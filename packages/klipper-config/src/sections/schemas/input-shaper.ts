import { input_shaperParams } from "../generated/tuning";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const inputShaperSchema = createSchemaFromParams(input_shaperParams);

export const inputShaperDefinition: SectionDefinition<typeof inputShaperSchema> = {
  id: "input_shaper",
  naming: { kind: "fixed", header: "input_shaper" },
  schema: inputShaperSchema,
  params: input_shaperParams,
  order: 47,
  category: "Tuning",
  label: "Input Shaper",
};
