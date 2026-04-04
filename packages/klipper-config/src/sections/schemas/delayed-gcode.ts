import { delayed_gcodeParams } from "../generated/macros";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const delayedGcodeSchema = createSchemaFromParams(delayed_gcodeParams);

export const delayedGcodeDefinition: SectionDefinition<typeof delayedGcodeSchema> = {
  id: "delayed_gcode",
  naming: { kind: "named", prefix: "delayed_gcode" },
  schema: delayedGcodeSchema,
  params: delayed_gcodeParams,
  namePattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
  order: 60,
  category: "Macros",
  label: "Delayed G-Code",
};
