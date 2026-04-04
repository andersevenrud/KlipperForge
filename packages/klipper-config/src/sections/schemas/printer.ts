import { printerParams } from "../generated/motion";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const overriddenPrinterParams: SectionParams = {
  ...printerParams,
  kinematics: {
    ...printerParams.kinematics,
    type: {
      kind: "choice",
      choices: ["cartesian", "corexy", "corexz", "delta", "hybrid_corexy", "hybrid_corexz"],
    },
  },
  max_z_velocity: {
    type: { kind: "number", above: 0 },
    description:
      "Maximum velocity (in mm/s) of the Z axis. This setting can be used to limit the maximum speed of the Z stepper motor. The default is to use max_velocity for max_z_velocity.",
    required: false,
  },
  max_z_accel: {
    type: { kind: "number", above: 0 },
    description:
      "Maximum acceleration (in mm/s^2) of the Z axis. This setting can be used to limit the maximum acceleration of the Z stepper motor. The default is to use max_accel for max_z_accel.",
    required: false,
  },
};

export const printerSchema = createSchemaFromParams(overriddenPrinterParams);

export const printerDefinition: SectionDefinition<typeof printerSchema> = {
  id: "printer",
  naming: { kind: "fixed", header: "printer" },
  schema: printerSchema,
  params: overriddenPrinterParams,
  order: 10,
  category: "Motion",
  label: "Printer",
};
