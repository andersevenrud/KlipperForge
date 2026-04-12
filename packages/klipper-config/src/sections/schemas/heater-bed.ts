import { heater_bedParams } from "../generated/heating";
import { defineSection } from "../schema-from-params";

export const { schema: heaterBedSchema, definition: heaterBedDefinition } = defineSection(heater_bedParams, {
  id: "heater_bed",
  naming: { kind: "fixed", header: "heater_bed" },
  order: 30,
  category: "Heating",
  label: "Heater Bed",
});
