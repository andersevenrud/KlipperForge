import { tmc2209Params, tmc5160Params } from "../generated/drivers";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const tmc2209ParamsWithMeta: SectionParams = {
  _target: {
    type: { kind: "string" },
    description: "Target stepper for this driver",
    required: false,
  },
  ...tmc2209Params,
};

const tmc5160ParamsWithMeta: SectionParams = {
  _target: {
    type: { kind: "string" },
    description: "Target stepper for this driver",
    required: false,
  },
  ...tmc5160Params,
};

export const tmcSchema = createSchemaFromParams(tmc2209ParamsWithMeta);
const tmc5160Schema = createSchemaFromParams(tmc5160ParamsWithMeta);

export const tmc2209Definition: SectionDefinition<typeof tmcSchema> = {
  id: "tmc2209",
  naming: { kind: "named", prefix: "tmc2209" },
  schema: tmcSchema,
  params: tmc2209ParamsWithMeta,
  metaFields: ["_target"],
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2209",
};

export const tmc5160Definition: SectionDefinition<typeof tmc5160Schema> = {
  id: "tmc5160",
  naming: { kind: "named", prefix: "tmc5160" },
  schema: tmc5160Schema,
  params: tmc5160ParamsWithMeta,
  metaFields: ["_target"],
  order: 22,
  category: "Stepper Drivers",
  label: "TMC5160",
};
