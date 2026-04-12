import { bltouchParams } from "../generated/probing";
import { defineSection } from "../schema-from-params";

export const { schema: bltouchSchema, definition: bltouchDefinition } = defineSection(bltouchParams, {
  id: "bltouch",
  naming: { kind: "fixed", header: "bltouch" },
  order: 40,
  category: "Probing",
  label: "BLTouch",
});
