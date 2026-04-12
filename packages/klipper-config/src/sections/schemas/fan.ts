import { fanParams } from "../generated/fans";
import { defineSection } from "../schema-from-params";

export const { schema: fanSchema, definition: fanDefinition } = defineSection(fanParams, {
  id: "fan",
  naming: { kind: "fixed", header: "fan" },
  order: 35,
  category: "Fans",
  label: "Part Cooling Fan",
});
