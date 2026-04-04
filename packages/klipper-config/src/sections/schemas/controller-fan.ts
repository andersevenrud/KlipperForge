import { controller_fanParams } from "../generated/fans";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const controllerFanSchema = createSchemaFromParams(controller_fanParams);

export const controllerFanDefinition: SectionDefinition<typeof controllerFanSchema> = {
  id: "controller_fan",
  naming: { kind: "named", prefix: "controller_fan" },
  schema: controllerFanSchema,
  params: controller_fanParams,
  order: 37,
  category: "Fans",
  label: "Controller Fan",
};
