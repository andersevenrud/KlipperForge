import { mcuParams } from "../generated/mcu";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const mcuParamsOverridden: SectionParams = {
  ...mcuParams,
  serial: { ...mcuParams.serial, required: false },
};

export const { schema: mcuSchema, definition: mcuDefinition } = defineSection(mcuParamsOverridden, {
  id: "mcu",
  naming: { kind: "fixed", header: "mcu" },
  order: 15,
  category: "MCU",
  label: "MCU",
});

export const { definition: mcuNamedDefinition } = defineSection(mcuParamsOverridden, {
  id: "mcu_named",
  naming: { kind: "named", prefix: "mcu" },
  order: 16,
  category: "MCU",
  label: "Additional MCU",
});
