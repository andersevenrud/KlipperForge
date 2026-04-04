import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const autotuneTmcParams: SectionParams = {
  motor: {
    type: { kind: "string" },
    description: "Motor name from the motor database.",
    required: true,
  },
  tuning_goal: {
    type: { kind: "choice", choices: ["auto", "silent", "performance", "autoswitch"] },
    description: "Tuning goal for the driver.",
    required: false,
    default: "auto",
  },
  extra_hysteresis: {
    type: { kind: "number", integer: true, min: 0, max: 8 },
    description: "Extra hysteresis added to the computed value.",
    required: false,
    default: 0,
  },
  tbl: {
    type: { kind: "number", integer: true, min: 0, max: 3 },
    description: "Comparator blank time (0-3).",
    required: false,
    default: 2,
  },
  toff: {
    type: { kind: "number", integer: true, min: 0, max: 15 },
    description: "Driver off time (0-15).",
    required: false,
    default: 0,
  },
  sgt: {
    type: { kind: "number", integer: true, min: -64, max: 63 },
    description: "StallGuard threshold.",
    required: false,
    default: 1,
  },
  sg4_thrs: {
    type: { kind: "number", integer: true, min: 0, max: 255 },
    description: "StallGuard4 threshold.",
    required: false,
    default: 10,
  },
  semin: {
    type: { kind: "number", integer: true, min: 0, max: 15 },
    description: "CoolStep minimum current threshold.",
    required: false,
    default: 2,
  },
  semax: {
    type: { kind: "number", integer: true, min: 0, max: 15 },
    description: "CoolStep maximum current threshold.",
    required: false,
    default: 4,
  },
  seup: {
    type: { kind: "number", integer: true, min: 0, max: 3 },
    description: "CoolStep current increment size.",
    required: false,
    default: 3,
  },
  sedn: {
    type: { kind: "number", integer: true, min: 0, max: 3 },
    description: "CoolStep current decrement speed.",
    required: false,
    default: 2,
  },
  seimin: {
    type: { kind: "number", integer: true, min: 0, max: 1 },
    description: "CoolStep minimum current (0=half, 1=quarter).",
    required: false,
    default: 1,
  },
  pwm_freq_target: {
    type: { kind: "number", min: 0 },
    description: "Target PWM frequency in Hz.",
    required: false,
    default: 55000,
  },
  voltage: {
    type: { kind: "number", min: 0, max: 60 },
    description: "Supply voltage in volts.",
    required: false,
    default: 24,
  },
  overvoltage_vth: {
    type: { kind: "number", min: 0, max: 60 },
    description: "Overvoltage threshold in volts.",
    required: false,
  },
};

const motorConstantsParams: SectionParams = {
  resistance: {
    type: { kind: "number", min: 0 },
    description: "Phase resistance in Ohms.",
    required: true,
  },
  inductance: {
    type: { kind: "number", min: 0 },
    description: "Phase inductance in Henries.",
    required: true,
  },
  holding_torque: {
    type: { kind: "number", min: 0 },
    description: "Holding torque in Nm.",
    required: true,
  },
  max_current: {
    type: { kind: "number", min: 0 },
    description: "Maximum rated current in Amps.",
    required: true,
  },
  steps_per_revolution: {
    type: { kind: "number", integer: true, min: 1 },
    description: "Steps per revolution (typically 200 or 400).",
    required: true,
  },
};

const autotuneTmcSchema = createSchemaFromParams(autotuneTmcParams);
const motorConstantsSchema = createSchemaFromParams(motorConstantsParams);

export const autotuneTmcDefinition: SectionDefinition<typeof autotuneTmcSchema> = {
  id: "autotune_tmc",
  naming: { kind: "suffixed", prefix: "autotune_tmc" },
  schema: autotuneTmcSchema,
  params: autotuneTmcParams,
  order: 82,
  category: "Plugins",
  label: "TMC Autotune",
};

export const motorConstantsDefinition: SectionDefinition<typeof motorConstantsSchema> = {
  id: "motor_constants",
  naming: { kind: "named", prefix: "motor_constants" },
  schema: motorConstantsSchema,
  params: motorConstantsParams,
  order: 83,
  category: "Plugins",
  label: "Motor Constants",
};
