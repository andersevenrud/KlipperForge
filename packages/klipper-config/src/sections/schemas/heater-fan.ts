import { heater_fanParams } from "../generated/fans";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const heaterFanSchema = createSchemaFromParams(heater_fanParams);

export const heaterFanDefinition: SectionDefinition<typeof heaterFanSchema> = {
  id: "heater_fan",
  naming: { kind: "named", prefix: "heater_fan" },
  schema: heaterFanSchema,
  params: heater_fanParams,
  order: 36,
  category: "Fans",
  label: "Heater Fan",
};
