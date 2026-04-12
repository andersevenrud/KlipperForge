import { safe_z_homeParams } from "../generated/homing";
import { defineSection } from "../schema-from-params";

export const { schema: safeZHomeSchema, definition: safeZHomeDefinition } = defineSection(safe_z_homeParams, {
  id: "safe_z_home",
  naming: { kind: "fixed", header: "safe_z_home" },
  order: 46,
  category: "Leveling",
  label: "Safe Z Home",
});
