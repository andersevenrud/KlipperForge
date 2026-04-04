import { heater_bedParams } from "../generated/heating";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const heaterBedSchema = createSchemaFromParams(heater_bedParams);

export const heaterBedDefinition: SectionDefinition<typeof heaterBedSchema> = {
  id: "heater_bed",
  naming: { kind: "fixed", header: "heater_bed" },
  schema: heaterBedSchema,
  params: heater_bedParams,
  order: 30,
  category: "Heating",
  label: "Heater Bed",
};
