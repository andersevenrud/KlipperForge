import { bltouchParams } from "../generated/probing";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const bltouchSchema = createSchemaFromParams(bltouchParams);

export const bltouchDefinition: SectionDefinition<typeof bltouchSchema> = {
  id: "bltouch",
  naming: { kind: "fixed", header: "bltouch" },
  schema: bltouchSchema,
  params: bltouchParams,
  order: 40,
  category: "Probing",
  label: "BLTouch",
};
