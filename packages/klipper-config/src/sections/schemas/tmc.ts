import {
  tmc2130Params,
  tmc2208Params,
  tmc2209Params,
  tmc2240Params,
  tmc2660Params,
  tmc5160Params,
} from "../generated/drivers";
import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

// Klipper accepts arbitrary "driver_<FIELD>" keys on every TMC section to set
// per-register overrides (see TMC_Drivers.md). These are not enumerated in
// Config_Reference.md so our extraction pipeline doesn't capture them. Allow
// them through the validator's unknown-field check via allowedFieldPattern
// so reference configs from klipper repo / KlipperXL don't warn on load.
const DRIVER_FIELD_PATTERN = /^driver_[A-Z][A-Za-z0-9_]*$/;

function withTargetMeta(params: SectionParams): SectionParams {
  return {
    _target: {
      type: { kind: "string" },
      description: "Target stepper for this driver",
      required: false,
    },
    ...params,
  };
}

const tmc2130ParamsWithMeta = withTargetMeta(tmc2130Params);
const tmc2208ParamsWithMeta = withTargetMeta(tmc2208Params);
const tmc2209ParamsWithMeta = withTargetMeta(tmc2209Params);
const tmc2240ParamsWithMeta = withTargetMeta(tmc2240Params);
const tmc2660ParamsWithMeta = withTargetMeta(tmc2660Params);
const tmc5160ParamsWithMeta = withTargetMeta(tmc5160Params);

const tmc2130Schema = createSchemaFromParams(tmc2130ParamsWithMeta);
const tmc2208Schema = createSchemaFromParams(tmc2208ParamsWithMeta);
export const tmcSchema = createSchemaFromParams(tmc2209ParamsWithMeta);
const tmc2240Schema = createSchemaFromParams(tmc2240ParamsWithMeta);
const tmc2660Schema = createSchemaFromParams(tmc2660ParamsWithMeta);
const tmc5160Schema = createSchemaFromParams(tmc5160ParamsWithMeta);

export const tmc2130Definition: SectionDefinition<typeof tmc2130Schema> = {
  id: "tmc2130",
  naming: { kind: "named", prefix: "tmc2130" },
  schema: tmc2130Schema,
  params: tmc2130ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2130",
};

export const tmc2208Definition: SectionDefinition<typeof tmc2208Schema> = {
  id: "tmc2208",
  naming: { kind: "named", prefix: "tmc2208" },
  schema: tmc2208Schema,
  params: tmc2208ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2208",
};

export const tmc2209Definition: SectionDefinition<typeof tmcSchema> = {
  id: "tmc2209",
  naming: { kind: "named", prefix: "tmc2209" },
  schema: tmcSchema,
  params: tmc2209ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2209",
};

export const tmc2240Definition: SectionDefinition<typeof tmc2240Schema> = {
  id: "tmc2240",
  naming: { kind: "named", prefix: "tmc2240" },
  schema: tmc2240Schema,
  params: tmc2240ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2240",
};

export const tmc2660Definition: SectionDefinition<typeof tmc2660Schema> = {
  id: "tmc2660",
  naming: { kind: "named", prefix: "tmc2660" },
  schema: tmc2660Schema,
  params: tmc2660ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC2660",
};

export const tmc5160Definition: SectionDefinition<typeof tmc5160Schema> = {
  id: "tmc5160",
  naming: { kind: "named", prefix: "tmc5160" },
  schema: tmc5160Schema,
  params: tmc5160ParamsWithMeta,
  metaFields: ["_target"],
  allowedFieldPattern: DRIVER_FIELD_PATTERN,
  order: 22,
  category: "Stepper Drivers",
  label: "TMC5160",
};
