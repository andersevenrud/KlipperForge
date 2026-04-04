import { extruderParams as generatedExtruderParams } from "../generated/heating";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const extruderParams: SectionParams = {
  ...generatedExtruderParams,
  gear_ratio: {
    type: { kind: "string" },
    description:
      'The gear ratio if the extruder stepper motor is connected via a gearbox. For example, one may specify "50:17" if a 50:17 gearbox is in use. The default is to not use a gear ratio.',
    required: false,
  },
};

export const extruderSchema = createSchemaFromParams(extruderParams);

export const extruderDefinition: SectionDefinition<typeof extruderSchema> = {
  id: "extruder",
  naming: { kind: "fixed", header: "extruder" },
  schema: extruderSchema,
  params: extruderParams,
  order: 25,
  category: "Heating",
  label: "Extruder",
};
