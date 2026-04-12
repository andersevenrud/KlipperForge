import {
  tmc2130Params,
  tmc2208Params,
  tmc2209Params,
  tmc2240Params,
  tmc2660Params,
  tmc5160Params,
} from "../generated/drivers";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

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

function defineTmc(id: string, label: string, params: SectionParams) {
  return defineSection(withTargetMeta(params), {
    id,
    naming: { kind: "named", prefix: id },
    metaFields: ["_target"],
    allowedFieldPattern: DRIVER_FIELD_PATTERN,
    order: 22,
    category: "Stepper Drivers",
    label,
  });
}

export const { definition: tmc2130Definition } = defineTmc("tmc2130", "TMC2130", tmc2130Params);
export const { definition: tmc2208Definition } = defineTmc("tmc2208", "TMC2208", tmc2208Params);
export const { schema: tmcSchema, definition: tmc2209Definition } = defineTmc("tmc2209", "TMC2209", tmc2209Params);
export const { definition: tmc2240Definition } = defineTmc("tmc2240", "TMC2240", tmc2240Params);
export const { definition: tmc2660Definition } = defineTmc("tmc2660", "TMC2660", tmc2660Params);
export const { definition: tmc5160Definition } = defineTmc("tmc5160", "TMC5160", tmc5160Params);
