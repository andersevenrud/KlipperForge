import { mcuParams } from "../generated/mcu";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const mcuParamsOverridden: SectionParams = {
  ...mcuParams,
  serial: { ...mcuParams.serial, required: false },
};

export const mcuSchema = createSchemaFromParams(mcuParamsOverridden);

export const mcuDefinition: SectionDefinition<typeof mcuSchema> = {
  id: "mcu",
  naming: { kind: "fixed", header: "mcu" },
  schema: mcuSchema,
  params: mcuParamsOverridden,
  order: 15,
  category: "MCU",
  label: "MCU",
};

export const mcuNamedDefinition: SectionDefinition<typeof mcuSchema> = {
  id: "mcu_named",
  naming: { kind: "named", prefix: "mcu" },
  schema: mcuSchema,
  params: mcuParamsOverridden,
  order: 16,
  category: "MCU",
  label: "Additional MCU",
};
