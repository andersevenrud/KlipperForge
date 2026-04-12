import { printerParams } from "../generated/motion";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

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

export const { schema: printerSchema, definition: printerDefinition } = defineSection(overriddenPrinterParams, {
  id: "printer",
  naming: { kind: "fixed", header: "printer" },
  order: 10,
  category: "Motion",
  label: "Printer",
});
