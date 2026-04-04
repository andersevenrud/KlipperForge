import { bed_meshParams } from "../generated/leveling";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const overriddenBedMeshParams: SectionParams = {
  ...bed_meshParams,
  probe_count: {
    ...bed_meshParams.probe_count,
    type: { kind: "string" },
  },
};

export const bedMeshSchema = createSchemaFromParams(overriddenBedMeshParams);

export const bedMeshDefinition: SectionDefinition<typeof bedMeshSchema> = {
  id: "bed_mesh",
  naming: { kind: "fixed", header: "bed_mesh" },
  schema: bedMeshSchema,
  params: overriddenBedMeshParams,
  order: 45,
  category: "Leveling",
  label: "Bed Mesh",
};
