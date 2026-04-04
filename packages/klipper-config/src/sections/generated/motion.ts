import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const printerParams: SectionParams = {
  kinematics: {
    type: { kind: "string" },
    description:
      "The type of printer in use. This option may be one of: cartesian, corexy, corexz, hybrid_corexy, hybrid_corexz, generic_cartesian, rotary_delta, delta, deltesian, polar, winch, or none. This parameter must be specified.",
    required: true,
  },
  max_velocity: {
    type: { kind: "number", above: 0 },
    description:
      "Maximum velocity (in mm/s) of the toolhead (relative to the print). This value may be changed at runtime using the SET_VELOCITY_LIMIT command. This parameter must be specified.",
    required: true,
  },
  max_accel: {
    type: { kind: "number", above: 0 },
    description:
      'Maximum acceleration (in mm/s^2) of the toolhead (relative to the print). Although this parameter is described as a "maximum" acceleration, in practice most moves that accelerate or decelerate will do so at the rate specified here. The value specified here may be changed at runtime using the SET_VELOCITY_LIMIT command. This parameter must be specified.',
    required: true,
  },
  minimum_cruise_ratio: {
    type: { kind: "number", min: 0, below: 1 },
    description:
      "Most moves will accelerate to a cruising speed, travel at that cruising speed, and then decelerate. However, some moves that travel a short distance could nominally accelerate and then immediately decelerate. This option reduces the top speed of these moves to ensure there is always a minimum distance traveled at a cruising speed. That is, it enforces a minimum distance traveled at cruising speed relative to the total distance traveled. It is intended to reduce the top speed of short zigzag moves (and thus reduce printer vibration from these moves). For example, a minimum_cruise_ratio of 0.5 would ensure that a standalone 1.5mm move would have a minimum cruising distance of 0.75mm. Specify a ratio of 0.0 to disable this feature (there would be no minimum cruising distance enforced between acceleration and deceleration). The value specified here may be changed at runtime using the SET_VELOCITY_LIMIT command. The default is 0.5.",
    required: false,
    default: 0.5,
  },
  square_corner_velocity: {
    type: { kind: "number", min: 0 },
    description:
      "The maximum velocity (in mm/s) that the toolhead may travel a 90 degree corner at. A non-zero value can reduce changes in extruder flow rates by enabling instantaneous velocity changes of the toolhead during cornering. This value configures the internal centripetal velocity cornering algorithm; corners with angles larger than 90 degrees will have a higher cornering velocity while corners with angles less than 90 degrees will have a lower cornering velocity. If this is set to zero then the toolhead will decelerate to zero at each corner. The value specified here may be changed at runtime using the SET_VELOCITY_LIMIT command. The default is 5mm/s.",
    required: false,
    default: 5,
  },
};

export const stepperParams: SectionParams = {
  step_pin: {
    type: { kind: "string" },
    description: "Step GPIO pin (triggered high). This parameter must be provided.",
    required: true,
  },
  dir_pin: {
    type: { kind: "string" },
    description: "Direction GPIO pin (high indicates positive direction). This parameter must be provided.",
    required: true,
  },
  enable_pin: {
    type: { kind: "string" },
    description:
      "Enable pin (default is enable high; use ! to indicate enable low). If this parameter is not provided then the stepper motor driver must always be enabled.",
    required: false,
  },
  rotation_distance: {
    type: { kind: "number", above: 0 },
    description:
      "Distance (in mm) that the axis travels with one full rotation of the stepper motor (or final gear if gear_ratio is specified). This parameter must be provided.",
    required: true,
  },
  microsteps: {
    type: { kind: "number", integer: true, min: 1 },
    description: "The number of microsteps the stepper motor driver uses. This parameter must be provided.",
    required: true,
  },
  full_steps_per_rotation: {
    type: { kind: "number", integer: true, min: 1 },
    description:
      "The number of full steps for one rotation of the stepper motor. Set this to 200 for a 1.8 degree stepper motor or set to 400 for a 0.9 degree motor. The default is 200.",
    required: false,
    default: 200,
  },
  gear_ratio: {
    type: { kind: "string" },
    description:
      'The gear ratio if the stepper motor is connected to the axis via a gearbox. For example, one may specify "5:1" if a 5 to 1 gearbox is in use. If the axis has multiple gearboxes one may specify a comma separated list of gear ratios (for example, "57:11, 2:1"). If a gear_ratio is specified then rotation_distance specifies the distance the axis travels for one full rotation of the final gear. The default is to not use a gear ratio.',
    required: false,
  },
  step_pulse_duration: {
    type: { kind: "number", min: 0 },
    description:
      'The minimum time between the step pulse signal edge and the following "unstep" signal edge. This is also used to set the minimum time between a step pulse and a direction change signal. The default is 0.000000100 (100ns) for TMC steppers that are configured in UART or SPI mode, and the default is 0.000002 (which is 2us) for all other steppers.',
    required: false,
    default: 1e-7,
  },
  endstop_pin: {
    type: { kind: "string" },
    description:
      'Endstop switch detection pin. If this endstop pin is on a different mcu than the stepper motor then it enables "multi-mcu homing". This parameter must be provided for the X, Y, and Z steppers on cartesian style printers.',
    required: false,
  },
  position_min: {
    type: { kind: "number" },
    description: "Minimum valid distance (in mm) the user may command the stepper to move to. The default is 0mm.",
    required: false,
    default: 0,
  },
  position_endstop: {
    type: { kind: "number" },
    description:
      "Location of the endstop (in mm). This parameter must be provided for the X, Y, and Z steppers on cartesian style printers.",
    required: false,
  },
  position_max: {
    type: { kind: "number" },
    description:
      "Maximum valid distance (in mm) the user may command the stepper to move to. This parameter must be provided for the X, Y, and Z steppers on cartesian style printers.",
    required: false,
  },
  homing_speed: {
    type: { kind: "number", above: 0 },
    description: "Maximum velocity (in mm/s) of the stepper when homing. The default is 5mm/s.",
    required: false,
    default: 5,
  },
  homing_retract_dist: {
    type: { kind: "number", min: 0 },
    description:
      "Distance to backoff (in mm) before homing a second time during homing. Set this to zero to disable the second home. The default is 5mm.",
    required: false,
    default: 5,
  },
  homing_retract_speed: {
    type: { kind: "number", above: 0 },
    description:
      "Speed to use on the retract move after homing in case this should be different from the homing speed, which is the default for this parameter",
    required: false,
  },
  second_homing_speed: {
    type: { kind: "number", above: 0 },
    description: "Velocity (in mm/s) of the stepper when performing the second home. The default is homing_speed/2.",
    required: false,
  },
  homing_positive_dir: {
    type: { kind: "boolean" },
    description:
      "If true, homing will cause the stepper to move in a positive direction (away from zero); if false, home towards zero. It is better to use the default than to specify this parameter. The default is true if position_endstop is near position_max and false if near position_min.",
    required: false,
  },
};

export const dual_carriageParams: SectionParams = {
  axis: {
    type: { kind: "choice", choices: ["x", "y"] },
    description: "The axis this extra carriage is on (either x or y). This parameter must be provided.",
    required: true,
  },
  safe_distance: {
    type: { kind: "number" },
    description:
      "The minimum distance (in mm) to enforce between the dual and the primary carriages. If a G-Code command is executed that will bring the carriages closer than the specified limit, such a command will be rejected with an error. If safe_distance is not provided, it will be inferred from position_min and position_max for the dual and primary carriages. If set to 0 (or safe_distance is unset and position_min and position_max are identical for the primary and dual carriages), the carriages proximity checks will be disabled.",
    required: false,
  },
  step_pin: {
    type: { kind: "string" },
    description: "step_pin parameter",
    required: false,
  },
  dir_pin: {
    type: { kind: "string" },
    description: "dir_pin parameter",
    required: false,
  },
  enable_pin: {
    type: { kind: "string" },
    description: "enable_pin parameter",
    required: false,
  },
  microsteps: {
    type: { kind: "number", integer: true, min: 1 },
    description: "microsteps parameter",
    required: false,
  },
  rotation_distance: {
    type: { kind: "number", above: 0 },
    description: "rotation_distance parameter",
    required: false,
  },
  endstop_pin: {
    type: { kind: "string" },
    description: "endstop_pin parameter",
    required: false,
  },
  position_endstop: {
    type: { kind: "number" },
    description: "position_endstop parameter",
    required: false,
  },
  position_min: {
    type: { kind: "number" },
    description: "position_min parameter",
    required: false,
  },
  position_max: {
    type: { kind: "number" },
    description: 'See the "stepper" section for the definition of the above parameters.',
    required: false,
  },
};

export const dualCarriageSchema = createSchemaFromParams(dual_carriageParams);

export const dualCarriageDefinition: SectionDefinition<typeof dualCarriageSchema> = {
  id: "dual_carriage",
  naming: { kind: "named", prefix: "dual_carriage" },
  schema: dualCarriageSchema,
  params: dual_carriageParams,
  order: 28,
  category: "Motion",
  label: "Dual Carriage",
};

export const extruder_stepperParams: SectionParams = {
  extruder: {
    type: { kind: "string" },
    description:
      "The extruder this stepper is synchronized to. If this is set to an empty string then the stepper will not be synchronized to an extruder. This parameter must be provided.",
    required: true,
  },
  step_pin: {
    type: { kind: "string" },
    description: "step_pin parameter",
    required: false,
  },
  dir_pin: {
    type: { kind: "string" },
    description: "dir_pin parameter",
    required: false,
  },
  enable_pin: {
    type: { kind: "string" },
    description: "enable_pin parameter",
    required: false,
  },
  microsteps: {
    type: { kind: "number", integer: true, min: 1 },
    description: "microsteps parameter",
    required: false,
  },
  rotation_distance: {
    type: { kind: "number", above: 0 },
    description: 'See the "stepper" section for the definition of the above parameters.',
    required: false,
  },
};

export const extruderStepperSchema = createSchemaFromParams(extruder_stepperParams);

export const extruderStepperDefinition: SectionDefinition<typeof extruderStepperSchema> = {
  id: "extruder_stepper",
  naming: { kind: "named", prefix: "extruder_stepper" },
  schema: extruderStepperSchema,
  params: extruder_stepperParams,
  order: 26,
  category: "Motion",
  label: "Extruder Stepper",
};

export const manual_stepperParams: SectionParams = {
  step_pin: {
    type: { kind: "string" },
    description: "Step GPIO pin (triggered high). This parameter must be provided.",
    required: false,
  },
  dir_pin: {
    type: { kind: "string" },
    description: "Direction GPIO pin (high indicates positive direction). This parameter must be provided.",
    required: false,
  },
  enable_pin: {
    type: { kind: "string" },
    description:
      "Enable pin (default is enable high; use ! to indicate enable low). If this parameter is not provided then the stepper motor driver must always be enabled.",
    required: false,
  },
  microsteps: {
    type: { kind: "number", integer: true, min: 1 },
    description: "The number of microsteps the stepper motor driver uses. This parameter must be provided.",
    required: false,
  },
  rotation_distance: {
    type: { kind: "number", above: 0 },
    description:
      "Distance (in mm) that the axis travels with one full rotation of the stepper motor (or final gear if gear_ratio is specified). This parameter must be provided.",
    required: false,
  },
  velocity: {
    type: { kind: "number", above: 0 },
    description:
      "Set the default velocity (in mm/s) for the stepper. This value will be used if a MANUAL_STEPPER command does not specify a SPEED parameter. The default is 5mm/s.",
    required: false,
    default: 5,
  },
  accel: {
    type: { kind: "number", min: 0 },
    description:
      "Set the default acceleration (in mm/s^2) for the stepper. An acceleration of zero will result in no acceleration. This value will be used if a MANUAL_STEPPER command does not specify an ACCEL parameter. The default is zero.",
    required: false,
    default: 0,
  },
  endstop_pin: {
    type: { kind: "string" },
    description:
      'Endstop switch detection pin. If specified, then one may perform "homing moves" by adding a STOP_ON_ENDSTOP parameter to MANUAL_STEPPER movement commands.',
    required: false,
  },
  position_min: {
    type: { kind: "number" },
    description: "Minimum valid distance (in mm) the user may command the stepper to move to. The default is 0mm.",
    required: false,
    default: 0,
  },
  position_max: {
    type: { kind: "number" },
    description:
      "The minimum and maximum position the stepper can be commanded to move to. If specified then one may not command the stepper to move past the given position. Note that these limits do not prevent setting an arbitrary position with the `MANUAL_STEPPER SET_POSITION=x` command. The default is to not enforce a limit.",
    required: false,
  },
  full_steps_per_rotation: {
    type: { kind: "number", integer: true, min: 1 },
    description:
      "The number of full steps for one rotation of the stepper motor. Set this to 200 for a 1.8 degree stepper motor or set to 400 for a 0.9 degree motor. The default is 200.",
    required: false,
    default: 200,
  },
  gear_ratio: {
    type: { kind: "string" },
    description:
      'The gear ratio if the stepper motor is connected to the axis via a gearbox. For example, one may specify "5:1" if a 5 to 1 gearbox is in use. If the axis has multiple gearboxes one may specify a comma separated list of gear ratios (for example, "57:11, 2:1"). If a gear_ratio is specified then rotation_distance specifies the distance the axis travels for one full rotation of the final gear. The default is to not use a gear ratio.',
    required: false,
  },
  step_pulse_duration: {
    type: { kind: "number", min: 0 },
    description:
      'The minimum time between the step pulse signal edge and the following "unstep" signal edge. This is also used to set the minimum time between a step pulse and a direction change signal. The default is 0.000000100 (100ns) for TMC steppers that are configured in UART or SPI mode, and the default is 0.000002 (which is 2us) for all other steppers.',
    required: false,
    default: 1e-7,
  },
};

export const manualStepperSchema = createSchemaFromParams(manual_stepperParams);

export const manualStepperDefinition: SectionDefinition<typeof manualStepperSchema> = {
  id: "manual_stepper",
  naming: { kind: "named", prefix: "manual_stepper" },
  schema: manualStepperSchema,
  params: manual_stepperParams,
  order: 27,
  category: "Motion",
  label: "Manual Stepper",
};
