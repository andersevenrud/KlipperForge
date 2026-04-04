import { safe_z_homeParams } from "../generated/homing";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const safeZHomeSchema = createSchemaFromParams(safe_z_homeParams);

export const safeZHomeDefinition: SectionDefinition<typeof safeZHomeSchema> = {
  id: "safe_z_home",
  naming: { kind: "fixed", header: "safe_z_home" },
  schema: safeZHomeSchema,
  params: safe_z_homeParams,
  order: 46,
  category: "Leveling",
  label: "Safe Z Home",
};
