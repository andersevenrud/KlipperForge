import { fanParams } from "../generated/fans";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const fanSchema = createSchemaFromParams(fanParams);

export const fanDefinition: SectionDefinition<typeof fanSchema> = {
  id: "fan",
  naming: { kind: "fixed", header: "fan" },
  schema: fanSchema,
  params: fanParams,
  order: 35,
  category: "Fans",
  label: "Part Cooling Fan",
};
