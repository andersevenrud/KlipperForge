import { bed_meshParams } from "../generated/leveling";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const overriddenBedMeshParams: SectionParams = {
  ...bed_meshParams,
  probe_count: {
    ...bed_meshParams.probe_count,
    type: { kind: "string" },
  },
};

export const { schema: bedMeshSchema, definition: bedMeshDefinition } = defineSection(overriddenBedMeshParams, {
  id: "bed_mesh",
  naming: { kind: "fixed", header: "bed_mesh" },
  order: 45,
  category: "Leveling",
  label: "Bed Mesh",
});
