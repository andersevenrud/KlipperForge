import { fan_genericParams } from "../generated/fans";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const fanGenericSchema = createSchemaFromParams(fan_genericParams);

export const fanGenericDefinition: SectionDefinition<typeof fanGenericSchema> = {
  id: "fan_generic",
  naming: { kind: "named", prefix: "fan_generic" },
  schema: fanGenericSchema,
  params: fan_genericParams,
  order: 38,
  category: "Fans",
  label: "Generic Fan",
};
