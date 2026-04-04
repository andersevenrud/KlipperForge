import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

const cartographerParams: SectionParams = {
  mcu: {
    type: { kind: "string" },
    description: "MCU identifier for the Cartographer probe.",
    required: false,
  },
  x_offset: {
    type: { kind: "number" },
    description: "X offset from nozzle in mm.",
    required: false,
  },
  y_offset: {
    type: { kind: "number" },
    description: "Y offset from nozzle in mm.",
    required: false,
  },
  verbose: {
    type: { kind: "boolean" },
    description: "Enable verbose logging.",
    required: false,
  },
  z_backlash: {
    type: { kind: "number", min: 0 },
    description: "Z backlash compensation in mm.",
    required: false,
    default: 0.05,
  },
  travel_speed: {
    type: { kind: "number", min: 1 },
    description: "Travel speed in mm/s.",
    required: false,
    default: 50,
  },
  lift_speed: {
    type: { kind: "number", min: 1 },
    description: "Z lift speed in mm/s.",
    required: false,
    default: 5,
  },
  macro_prefix: {
    type: { kind: "string" },
    description: "Prefix for Cartographer macros.",
    required: false,
  },
};

export const cartographerSchema = createSchemaFromParams(cartographerParams);

export const cartographerDefinition: SectionDefinition<typeof cartographerSchema> = {
  id: "cartographer",
  naming: { kind: "custom", header: "cartographer" },
  schema: cartographerSchema,
  params: cartographerParams,
  order: 60,
  category: "Probing",
  label: "Cartographer",
  overrides: [
    {
      target: "stepper_z",
      values: {
        endstop_pin: "probe:z_virtual_endstop",
        homing_retract_dist: 0,
      },
    },
  ],
};

// --- [cartographer scan] ---

const cartographerScanParams: SectionParams = {
  samples: {
    type: { kind: "number", integer: true },
    description: "Number of samples per probe point.",
    required: false,
    default: 20,
  },
  probe_speed: {
    type: { kind: "number", min: 0.1 },
    description: "Probe speed in mm/s.",
    required: false,
    default: 5,
  },
  mesh_runs: {
    type: { kind: "number", integer: true },
    description: "Number of mesh runs.",
    required: false,
    default: 1,
  },
  mesh_height: {
    type: { kind: "number", min: 1 },
    description: "Height for scan mesh probing in mm.",
    required: false,
    default: 3,
  },
  mesh_direction: {
    type: { kind: "choice", choices: ["x", "y"] },
    description: "Primary direction for mesh probing.",
    required: false,
    default: "x",
  },
  mesh_path: {
    type: {
      kind: "choice",
      choices: ["snake", "alternating_snake", "spiral", "random"],
    },
    description: "Path pattern for mesh probing.",
    required: false,
    default: "snake",
  },
};

export const cartographerScanSchema = createSchemaFromParams(cartographerScanParams);

export const cartographerScanDefinition: SectionDefinition<typeof cartographerScanSchema> = {
  id: "cartographer_scan",
  naming: { kind: "fixed", header: "cartographer scan" },
  schema: cartographerScanSchema,
  params: cartographerScanParams,
  order: 61,
  category: "Probing",
  label: "Cartographer Scan",
};

// --- [cartographer touch] ---

const cartographerTouchParams: SectionParams = {
  samples: {
    type: { kind: "number", integer: true, min: 3 },
    description: "Number of touch samples.",
    required: false,
    default: 3,
  },
  max_samples: {
    type: { kind: "number", integer: true },
    description: "Maximum number of touch samples.",
    required: false,
    default: 10,
  },
  max_noisy_samples: {
    type: { kind: "number", integer: true, min: 0 },
    description: "Maximum number of noisy samples to discard.",
    required: false,
    default: 2,
  },
  max_touch_temperature: {
    type: { kind: "number", integer: true },
    description: "Maximum hotend temperature for touch probing in Celsius.",
    required: false,
    default: 150,
  },
  home_random_radius: {
    type: { kind: "number", min: 0 },
    description: "Random radius for homing position in mm.",
    required: false,
    default: 0,
  },
  retract_distance: {
    type: { kind: "number", min: 1 },
    description: "Retract distance after touch in mm.",
    required: false,
    default: 2,
  },
  sample_range: {
    type: { kind: "number", min: 0.001, max: 0.015 },
    description: "Acceptable sample range in mm.",
    required: false,
    default: 0.01,
  },
};

export const cartographerTouchSchema = createSchemaFromParams(cartographerTouchParams);

export const cartographerTouchDefinition: SectionDefinition<typeof cartographerTouchSchema> = {
  id: "cartographer_touch",
  naming: { kind: "fixed", header: "cartographer touch" },
  schema: cartographerTouchSchema,
  params: cartographerTouchParams,
  order: 61,
  category: "Probing",
  label: "Cartographer Touch",
};

// --- [cartographer coil] ---

const cartographerCoilParams: SectionParams = {
  name: {
    type: { kind: "string" },
    description: "Name for the coil temperature sensor.",
    required: false,
    default: "cartographer_coil",
  },
  min_temp: {
    type: { kind: "number", min: -273.15 },
    description: "Minimum temperature in Celsius.",
    required: false,
    default: 0,
  },
  max_temp: {
    type: { kind: "number" },
    description: "Maximum temperature in Celsius.",
    required: false,
    default: 105,
  },
};

export const cartographerCoilSchema = createSchemaFromParams(cartographerCoilParams);

export const cartographerCoilDefinition: SectionDefinition<typeof cartographerCoilSchema> = {
  id: "cartographer_coil",
  naming: { kind: "fixed", header: "cartographer coil" },
  schema: cartographerCoilSchema,
  params: cartographerCoilParams,
  order: 61,
  category: "Probing",
  label: "Cartographer Coil",
};
