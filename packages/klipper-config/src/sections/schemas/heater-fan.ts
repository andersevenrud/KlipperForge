import { heater_fanParams } from "../generated/fans";
import { defineSection } from "../schema-from-params";

export const { schema: heaterFanSchema, definition: heaterFanDefinition } = defineSection(heater_fanParams, {
  id: "heater_fan",
  naming: { kind: "named", prefix: "heater_fan" },
  order: 36,
  category: "Fans",
  label: "Heater Fan",
});
