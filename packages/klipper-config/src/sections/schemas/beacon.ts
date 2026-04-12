import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const beaconParams: SectionParams = {
  serial: {
    type: { kind: "string" },
    description: "Serial port path for the Beacon probe.",
    required: false,
  },
  speed: {
    type: { kind: "number" },
    description: "Probing speed in mm/s.",
    required: false,
  },
  lift_speed: {
    type: { kind: "number" },
    description: "Z lift speed after probing in mm/s.",
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
  trigger_distance: {
    type: { kind: "number" },
    description: "Trigger distance in mm.",
    required: false,
  },
  mesh_main_direction: {
    type: { kind: "choice", choices: ["x", "y"] },
    description: "Primary travel direction during mesh probing.",
    required: false,
  },
  default_probe_method: {
    type: { kind: "choice", choices: ["contact", "proximity"] },
    description: "Default probe method.",
    required: false,
  },
  contact_max_hotend_temperature: {
    type: { kind: "number" },
    description: "Maximum hotend temperature (in Celsius) for contact probing.",
    required: false,
  },
  home_xy_position: {
    type: { kind: "string" },
    description: "X,Y position for homing (e.g. '150, 150').",
    required: false,
  },
  home_z_hop: {
    type: { kind: "number" },
    description: "Z hop distance after homing in mm.",
    required: false,
  },
  home_method: {
    type: { kind: "choice", choices: ["contact", "proximity"] },
    description: "Homing method.",
    required: false,
  },
};

export const { schema: beaconSchema, definition: beaconDefinition } = defineSection(beaconParams, {
  id: "beacon",
  naming: { kind: "custom", header: "beacon" },
  order: 60,
  category: "Probing",
  label: "Beacon",
  overrides: [
    {
      target: "stepper_z",
      values: {
        endstop_pin: "probe:z_virtual_endstop",
        homing_retract_dist: 0,
      },
    },
  ],
});
