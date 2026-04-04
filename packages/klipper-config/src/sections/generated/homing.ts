import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const safe_z_homeParams: SectionParams = {
  home_xy_position: {
    type: { kind: "string" },
    description:
      "A X, Y coordinate (e.g. 100, 100) where the Z homing should be performed. This parameter must be provided.",
    required: true,
  },
  speed: {
    type: { kind: "number", above: 0 },
    description: "Speed at which the toolhead is moved to the safe Z home coordinate. The default is 50 mm/s",
    required: false,
    default: 50,
  },
  z_hop: {
    type: { kind: "number" },
    description:
      "Distance (in mm) to lift the Z axis prior to homing. This is applied to any homing command, even if it doesn't home the Z axis. If the Z axis is already homed and the current Z position is less than z_hop, then this will lift the head to a height of z_hop. If the Z axis is not already homed the head is lifted by z_hop. The default is to not implement Z hop.",
    required: false,
  },
  z_hop_speed: {
    type: { kind: "number", above: 0 },
    description: "Speed (in mm/s) at which the Z axis is lifted prior to homing. The default is 15 mm/s.",
    required: false,
    default: 15,
  },
  move_to_previous: {
    type: { kind: "boolean" },
    description:
      "When set to True, the X and Y axes are reset to their previous positions after Z axis homing. The default is False.",
    required: false,
    default: false,
  },
};

export const homing_overrideParams: SectionParams = {
  gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute in place of G28 commands found in the normal g-code input. See docs/Command_Templates.md for G-Code format. If a G28 is contained in this list of commands then it will invoke the normal homing procedure for the printer. The commands listed here must home all axes. This parameter must be provided.",
    required: true,
  },
  axes: {
    type: { kind: "string" },
    description:
      'The axes to override. For example, if this is set to "z" then the override script will only be run when the z axis is homed (eg, via a "G28" or "G28 Z0" command). Note, the override script should still home all axes. The default is "xyz" which causes the override script to be run in place of all G28 commands.',
    required: false,
    default: "XYZ",
  },
  set_position_x: {
    type: { kind: "string" },
    description: "set_position_x parameter",
    required: false,
  },
  set_position_y: {
    type: { kind: "string" },
    description: "set_position_y parameter",
    required: false,
  },
  set_position_z: {
    type: { kind: "string" },
    description:
      "If specified, the printer will assume the axis is at the specified position prior to running the above g-code commands. Setting this disables homing checks for that axis. This may be useful if the head must move prior to invoking the normal G28 mechanism for an axis. The default is to not force a position for an axis.",
    required: false,
  },
};

export const homingOverrideSchema = createSchemaFromParams(homing_overrideParams);

export const homingOverrideDefinition: SectionDefinition<typeof homingOverrideSchema> = {
  id: "homing_override",
  naming: { kind: "fixed", header: "homing_override" },
  schema: homingOverrideSchema,
  params: homing_overrideParams,
  order: 49,
  category: "Homing",
  label: "Homing Override",
};

export const endstop_phaseParams: SectionParams = {
  endstop_accuracy: {
    type: { kind: "number", above: 0 },
    description:
      "Sets the expected accuracy (in mm) of the endstop. This represents the maximum error distance the endstop may trigger (eg, if an endstop may occasionally trigger 100um early or up to 100um late then set this to 0.200 for 200um). The default is 4*rotation_distance/full_steps_per_rotation.",
    required: false,
    default: 4,
  },
  trigger_phase: {
    type: { kind: "string" },
    description:
      'This specifies the phase of the stepper motor driver to expect when hitting the endstop. It is composed of two numbers separated by a forward slash character - the phase and the total number of phases (eg, "7/64"). Only set this value if one is sure the stepper motor driver is reset every time the mcu is reset. If this is not set, then the stepper phase will be detected on the first home and that phase will be used on all subsequent homes.',
    required: false,
  },
  endstop_align_zero: {
    type: { kind: "boolean" },
    description:
      "If true then the position_endstop of the axis will effectively be modified so that the zero position for the axis occurs at a full step on the stepper motor. (If used on the Z axis and the print layer height is a multiple of a full step distance then every layer will occur on a full step.) The default is False.",
    required: false,
    default: false,
  },
};

export const endstopPhaseSchema = createSchemaFromParams(endstop_phaseParams);

export const endstopPhaseDefinition: SectionDefinition<typeof endstopPhaseSchema> = {
  id: "endstop_phase",
  naming: { kind: "named", prefix: "endstop_phase" },
  schema: endstopPhaseSchema,
  params: endstop_phaseParams,
  order: 49,
  category: "Homing",
  label: "Endstop Phase",
};
