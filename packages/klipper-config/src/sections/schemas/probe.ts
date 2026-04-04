import { probeParams } from "../generated/probing";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const probeSchema = createSchemaFromParams(probeParams);

export const probeDefinition: SectionDefinition<typeof probeSchema> = {
  id: "probe",
  naming: { kind: "fixed", header: "probe" },
  schema: probeSchema,
  params: probeParams,
  order: 40,
  category: "Probing",
  label: "Probe",
};
