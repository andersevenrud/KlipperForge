import { fan_genericParams } from "../generated/fans";
import { defineSection } from "../schema-from-params";

export const { schema: fanGenericSchema, definition: fanGenericDefinition } = defineSection(fan_genericParams, {
  id: "fan_generic",
  naming: { kind: "named", prefix: "fan_generic" },
  order: 38,
  category: "Fans",
  label: "Generic Fan",
});
