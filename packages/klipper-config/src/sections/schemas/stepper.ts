import { stepperParams } from "../generated/motion";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const stepperParamsWithMeta: SectionParams = {
  _name: {
    type: { kind: "string" },
    description: "Internal name for this stepper instance",
    required: false,
  },
  ...stepperParams,
};

export const { schema: stepperSchema, definition: stepperDefinition } = defineSection(stepperParamsWithMeta, {
  id: "stepper",
  naming: { kind: "suffixed", prefix: "stepper" },
  metaFields: ["_name"],
  order: 20,
  category: "Motion",
  label: "Stepper",
});
