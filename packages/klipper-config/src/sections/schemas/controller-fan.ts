import { controller_fanParams } from "../generated/fans";
import { defineSection } from "../schema-from-params";

export const { schema: controllerFanSchema, definition: controllerFanDefinition } = defineSection(
  controller_fanParams,
  {
    id: "controller_fan",
    naming: { kind: "named", prefix: "controller_fan" },
    order: 37,
    category: "Fans",
    label: "Controller Fan",
  },
);
