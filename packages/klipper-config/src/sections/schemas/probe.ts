import { probeParams } from "../generated/probing";
import { defineSection } from "../schema-from-params";

export const { schema: probeSchema, definition: probeDefinition } = defineSection(probeParams, {
  id: "probe",
  naming: { kind: "fixed", header: "probe" },
  order: 40,
  category: "Probing",
  label: "Probe",
});
