import { stepperParams } from "../generated/motion";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const stepperParamsWithMeta: SectionParams = {
  _name: {
    type: { kind: "string" },
    description: "Internal name for this stepper instance",
    required: false,
  },
  ...stepperParams,
};

export const stepperSchema = createSchemaFromParams(stepperParamsWithMeta);

export const stepperDefinition: SectionDefinition<typeof stepperSchema> = {
  id: "stepper",
  naming: { kind: "suffixed", prefix: "stepper" },
  schema: stepperSchema,
  params: stepperParamsWithMeta,
  metaFields: ["_name"],
  order: 20,
  category: "Motion",
  label: "Stepper",
};
