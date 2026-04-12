import { extruderParams as generatedExtruderParams } from "../generated/heating";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const extruderParams: SectionParams = {
  ...generatedExtruderParams,
  gear_ratio: {
    type: { kind: "string" },
    description:
      'The gear ratio if the extruder stepper motor is connected via a gearbox. For example, one may specify "50:17" if a 50:17 gearbox is in use. The default is to not use a gear ratio.',
    required: false,
  },
};

export const { schema: extruderSchema, definition: extruderDefinition } = defineSection(extruderParams, {
  id: "extruder",
  naming: { kind: "fixed", header: "extruder" },
  order: 25,
  category: "Heating",
  label: "Extruder",
});
