import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const probeParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description:
      'Probe detection pin. If the pin is on a different microcontroller than the Z steppers then it enables "multi-mcu homing". This parameter must be provided.',
    required: true,
  },
  deactivate_on_each_sample: {
    type: { kind: "boolean" },
    description:
      "This determines if Klipper should execute deactivation gcode between each probe attempt when performing a multiple probe sequence. The default is True.",
    required: false,
    default: true,
  },
  x_offset: {
    type: { kind: "number" },
    description: "The distance (in mm) between the probe and the nozzle along the x-axis. The default is 0.",
    required: false,
    default: 0,
  },
  y_offset: {
    type: { kind: "number" },
    description: "The distance (in mm) between the probe and the nozzle along the y-axis. The default is 0.",
    required: false,
    default: 0,
  },
  z_offset: {
    type: { kind: "number" },
    description:
      "The distance (in mm) between the bed and the nozzle when the probe triggers. This parameter must be provided.",
    required: true,
  },
  speed: {
    type: { kind: "number", above: 0 },
    description: "Speed (in mm/s) of the Z axis when probing. The default is 5mm/s.",
    required: false,
    default: 5,
  },
  samples: {
    type: { kind: "number", integer: true, min: 1 },
    description:
      "The number of times to probe each point. The probed z-values will be averaged. The default is to probe 1 time.",
    required: false,
    default: 1,
  },
  sample_retract_dist: {
    type: { kind: "number", above: 0 },
    description:
      "The distance (in mm) to lift the toolhead between each sample (if sampling more than once). The default is 2mm.",
    required: false,
    default: 2,
  },
  lift_speed: {
    type: { kind: "number", above: 0 },
    description:
      "Speed (in mm/s) of the Z axis when lifting the probe between samples. The default is to use the same value as the 'speed' parameter.",
    required: false,
  },
  samples_result: {
    type: { kind: "choice", choices: ["median", "average"] },
    description:
      'The calculation method when sampling more than once - either "median" or "average". The default is average.',
    required: false,
  },
  samples_tolerance: {
    type: { kind: "number", min: 0 },
    description:
      "The maximum Z distance (in mm) that a sample may differ from other samples. If this tolerance is exceeded then either an error is reported or the attempt is restarted (see samples_tolerance_retries). The default is 0.100mm.",
    required: false,
    default: 0.1,
  },
  samples_tolerance_retries: {
    type: { kind: "number", integer: true, min: 0 },
    description:
      "The number of times to retry if a sample is found that exceeds samples_tolerance. On a retry, all current samples are discarded and the probe attempt is restarted. If a valid set of samples are not obtained in the given number of retries then an error is reported. The default is zero which causes an error to be reported on the first sample that exceeds samples_tolerance.",
    required: false,
    default: 0,
  },
  activate_gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute prior to each probe attempt. See docs/Command_Templates.md for G-Code format. This may be useful if the probe needs to be activated in some way. Do not issue any commands here that move the toolhead (eg, G1). The default is to not run any special G-Code commands on activation.",
    required: false,
  },
  deactivate_gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute after each probe attempt completes. See docs/Command_Templates.md for G-Code format. Do not issue any commands here that move the toolhead. The default is to not run any special G-Code commands on deactivation.",
    required: false,
  },
};

export const bltouchParams: SectionParams = {
  sensor_pin: {
    type: { kind: "string" },
    description:
      'Pin connected to the BLTouch sensor pin. Most BLTouch devices require a pullup on the sensor pin (prefix the pin name with "^"). This parameter must be provided.',
    required: true,
  },
  control_pin: {
    type: { kind: "string" },
    description: "Pin connected to the BLTouch control pin. This parameter must be provided.",
    required: true,
  },
  pin_move_time: {
    type: { kind: "number", above: 0 },
    description:
      "The amount of time (in seconds) to wait for the BLTouch pin to move up or down. The default is 0.680 seconds.",
    required: false,
    default: 0.68,
  },
  stow_on_each_sample: {
    type: { kind: "boolean" },
    description:
      "This determines if Klipper should command the pin to move up between each probe attempt when performing a multiple probe sequence. Read the directions in docs/BLTouch.md before setting this to False. The default is True.",
    required: false,
    default: true,
  },
  probe_with_touch_mode: {
    type: { kind: "boolean" },
    description:
      'If this is set to True then Klipper will probe with the device in "touch_mode". The default is False (probing in "pin_down" mode).',
    required: false,
    default: false,
  },
  pin_up_reports_not_triggered: {
    type: { kind: "boolean" },
    description:
      'Set if the BLTouch consistently reports the probe in a "not triggered" state after a successful "pin_up" command. This should be True for all genuine BLTouch devices. Read the directions in docs/BLTouch.md before setting this to False. The default is True.',
    required: false,
    default: true,
  },
  pin_up_touch_mode_reports_triggered: {
    type: { kind: "boolean" },
    description:
      'Set if the BLTouch consistently reports a "triggered" state after the commands "pin_up" followed by "touch_mode". This should be True for all genuine BLTouch devices. Read the directions in docs/BLTouch.md before setting this to False. The default is True.',
    required: false,
    default: true,
  },
  set_output_mode: {
    type: { kind: "string" },
    description:
      'Request a specific sensor pin output mode on the BLTouch V3.0 (and later). This setting should not be used on other types of probes. Set to "5V" to request a sensor pin output of 5 Volts (only use if the controller board needs 5V mode and is 5V tolerant on its input signal line). Set to "OD" to request the sensor pin output use open drain mode. The default is to not request an output mode.',
    required: false,
  },
  x_offset: {
    type: { kind: "number" },
    description: "x_offset parameter",
    required: false,
    default: 0,
  },
  y_offset: {
    type: { kind: "number" },
    description: "y_offset parameter",
    required: false,
    default: 0,
  },
  z_offset: {
    type: { kind: "number", min: 0 },
    description: "z_offset parameter",
    required: false,
  },
  speed: {
    type: { kind: "number" },
    description: "speed parameter",
    required: false,
  },
  lift_speed: {
    type: { kind: "number", above: 0 },
    description: "lift_speed parameter",
    required: false,
  },
  samples: {
    type: { kind: "number", integer: true, min: 1 },
    description: "samples parameter",
    required: false,
    default: 1,
  },
  sample_retract_dist: {
    type: { kind: "number", above: 0 },
    description: "sample_retract_dist parameter",
    required: false,
    default: 2,
  },
  samples_result: {
    type: { kind: "string" },
    description: "samples_result parameter",
    required: false,
  },
  samples_tolerance: {
    type: { kind: "number", min: 0 },
    description: "samples_tolerance parameter",
    required: false,
    default: 0.1,
  },
  samples_tolerance_retries: {
    type: { kind: "number", integer: true, min: 0 },
    description: 'See the "probe" section for information on these parameters.',
    required: false,
    default: 0,
  },
};

export const smart_effectorParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description:
      "Pin connected to the Smart Effector Z Probe output pin (pin 5). Note that pullup resistor on the board is generally not required. However, if the output pin is connected to the board pin with a pullup resistor, that resistor must be high value (e.g. 10K Ohm or more). Some boards have a low value pullup resistor on the Z probe input, which will likely result in an always-triggered probe state. In this case, connect the Smart Effector to a different pin on the board. This parameter is required.",
    required: true,
  },
  control_pin: {
    type: { kind: "string" },
    description:
      "Pin connected to the Smart Effector control input pin (pin 7). If provided, Smart Effector sensitivity programming commands become available.",
    required: false,
  },
  probe_accel: {
    type: { kind: "number", min: 0 },
    description:
      "If set, limits the acceleration of the probing moves (in mm/sec^2). A sudden large acceleration at the beginning of the probing move may cause spurious probe triggering, especially if the hotend is heavy. To prevent that, it may be necessary to reduce the acceleration of the probing moves via this parameter.",
    required: false,
    default: 0,
  },
  recovery_time: {
    type: { kind: "number", min: 0 },
    description:
      "A delay between the travel moves and the probing moves in seconds. A fast travel move prior to probing may result in a spurious probe triggering. This may cause 'Probe triggered prior to movement' errors if no delay is set. Value 0 disables the recovery delay. Default value is 0.4.",
    required: false,
    default: 0.4,
  },
  x_offset: {
    type: { kind: "number" },
    description: "x_offset parameter",
    required: false,
    default: 0,
  },
  y_offset: {
    type: { kind: "number" },
    description: "Should be left unset (or set to 0).",
    required: false,
    default: 0,
  },
  z_offset: {
    type: { kind: "number", min: 0 },
    description:
      "Trigger height of the probe. Start with -0.1 (mm), and adjust later using `PROBE_CALIBRATE` command. This parameter must be provided.",
    required: true,
  },
  speed: {
    type: { kind: "number" },
    description:
      "Speed (in mm/s) of the Z axis when probing. It is recommended to start with the probing speed of 20 mm/s and adjust it as necessary to improve the accuracy and repeatability of the probe triggering.",
    required: false,
  },
  samples: {
    type: { kind: "number", integer: true, min: 1 },
    description: "samples parameter",
    required: false,
    default: 1,
  },
  sample_retract_dist: {
    type: { kind: "number", above: 0 },
    description: "sample_retract_dist parameter",
    required: false,
    default: 2,
  },
  samples_result: {
    type: { kind: "string" },
    description: "samples_result parameter",
    required: false,
  },
  samples_tolerance: {
    type: { kind: "number", min: 0 },
    description: "samples_tolerance parameter",
    required: false,
    default: 0.1,
  },
  samples_tolerance_retries: {
    type: { kind: "number", integer: true, min: 0 },
    description: "samples_tolerance_retries parameter",
    required: false,
    default: 0,
  },
  activate_gcode: {
    type: { kind: "multiline" },
    description: "activate_gcode parameter",
    required: false,
  },
  deactivate_gcode: {
    type: { kind: "multiline" },
    description: "deactivate_gcode parameter",
    required: false,
  },
  deactivate_on_each_sample: {
    type: { kind: "boolean" },
    description: 'See the "probe" section for more information on the parameters above.',
    required: false,
    default: true,
  },
};

export const smartEffectorSchema = createSchemaFromParams(smart_effectorParams);

export const smartEffectorDefinition: SectionDefinition<typeof smartEffectorSchema> = {
  id: "smart_effector",
  naming: { kind: "fixed", header: "smart_effector" },
  schema: smartEffectorSchema,
  params: smart_effectorParams,
  order: 40,
  category: "Probing",
  label: "Smart Effector",
};

export const probe_eddy_currentParams: SectionParams = {
  sensor_type: {
    type: { kind: "string" },
    description:
      "The sensor chip used to perform eddy current measurements. This parameter must be provided and must be set to ldc1612.",
    required: true,
  },
  frequency: {
    type: { kind: "number", integer: true },
    description: "The external crystal frequency (in Hz) of the LDC1612 chip. The default is 12000000.",
    required: false,
    default: 12000000,
  },
  intb_pin: {
    type: { kind: "string" },
    description:
      "MCU gpio pin connected to the ldc1612 sensor's INTB pin (if available). The default is to not use the INTB pin.",
    required: false,
  },
  z_offset: {
    type: { kind: "number", min: 0 },
    description:
      "The nominal distance (in mm) between the nozzle and bed that a probing attempt should stop at. This parameter must be provided.",
    required: false,
  },
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "i2c_address parameter",
    required: false,
  },
  i2c_mcu: {
    type: { kind: "string" },
    description: "i2c_mcu parameter",
    required: false,
    default: "mcu",
  },
  i2c_bus: {
    type: { kind: "string" },
    description: "i2c_bus parameter",
    required: false,
  },
  i2c_software_scl_pin: {
    type: { kind: "string" },
    description: "i2c_software_scl_pin parameter",
    required: false,
  },
  i2c_software_sda_pin: {
    type: { kind: "string" },
    description: "i2c_software_sda_pin parameter",
    required: false,
  },
  i2c_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description:
      'The i2c settings for the sensor chip. See the "common I2C settings" section for a description of the above parameters.',
    required: false,
  },
  x_offset: {
    type: { kind: "number" },
    description: "x_offset parameter",
    required: false,
    default: 0,
  },
  y_offset: {
    type: { kind: "number" },
    description: "y_offset parameter",
    required: false,
    default: 0,
  },
  speed: {
    type: { kind: "number" },
    description: "speed parameter",
    required: false,
  },
  lift_speed: {
    type: { kind: "number", above: 0 },
    description: "lift_speed parameter",
    required: false,
  },
  samples: {
    type: { kind: "number", integer: true, min: 1 },
    description: "samples parameter",
    required: false,
    default: 1,
  },
  sample_retract_dist: {
    type: { kind: "number", above: 0 },
    description: "sample_retract_dist parameter",
    required: false,
    default: 2,
  },
  samples_result: {
    type: { kind: "string" },
    description: "samples_result parameter",
    required: false,
  },
  samples_tolerance: {
    type: { kind: "number", min: 0 },
    description: "samples_tolerance parameter",
    required: false,
    default: 0.1,
  },
  samples_tolerance_retries: {
    type: { kind: "number", integer: true, min: 0 },
    description: 'See the "probe" section for information on these parameters.',
    required: false,
    default: 0,
  },
  tap_threshold: {
    type: { kind: "number", above: 0 },
    description:
      'Noise cutoff/stop trigger threshold (in Hz). Specify this value to enable support for "METHOD=tap" probe commands. See Eddy_Probe.md for more information. Larger values make the tap detection less sensitive. That is, larger values make it less likely the toolhead will incorrectly stop early due to noise, while increasing the risk of the toolhead not correctly stopping when it first contacts the bed. If this value is specified then one may override its value at run-time using the "TAP_THRESHOLD" parameter on probe commands. The default is to not enable support for "tap" probing.',
    required: false,
    default: 0,
  },
};

export const probeEddyCurrentSchema = createSchemaFromParams(probe_eddy_currentParams);

export const probeEddyCurrentDefinition: SectionDefinition<typeof probeEddyCurrentSchema> = {
  id: "probe_eddy_current",
  naming: { kind: "named", prefix: "probe_eddy_current" },
  schema: probeEddyCurrentSchema,
  params: probe_eddy_currentParams,
  order: 40,
  category: "Probing",
  label: "Probe Eddy Current",
};

export const axis_twist_compensationParams: SectionParams = {
  speed: {
    type: { kind: "number" },
    description: "The speed (in mm/s) of non-probing moves during the calibration. The default is 50.",
    required: false,
    default: 50,
  },
  horizontal_move_z: {
    type: { kind: "number" },
    description:
      "The height (in mm) that the head should be commanded to move to just prior to starting a probe operation. The default is 5.",
    required: false,
    default: 5,
  },
  calibrate_start_x: {
    type: { kind: "number" },
    description:
      "Defines the minimum X coordinate of the calibration This should be the X coordinate that positions the nozzle at the starting calibration position.",
    required: true,
    default: 20,
  },
  calibrate_end_x: {
    type: { kind: "number" },
    description:
      "Defines the maximum X coordinate of the calibration This should be the X coordinate that positions the nozzle at the ending calibration position.",
    required: true,
    default: 200,
  },
  calibrate_y: {
    type: { kind: "number" },
    description:
      "Defines the Y coordinate of the calibration This should be the Y coordinate that positions the nozzle during the calibration process. This parameter is recommended to be near the center of the bed For Y-axis twist compensation, specify the following parameters:",
    required: true,
    default: 112.5,
  },
  calibrate_start_y: {
    type: { kind: "number" },
    description:
      "Defines the minimum Y coordinate of the calibration This should be the Y coordinate that positions the nozzle at the starting calibration position for the Y axis. This parameter must be provided if compensating for Y axis twist.",
    required: true,
  },
  calibrate_end_y: {
    type: { kind: "number" },
    description:
      "Defines the maximum Y coordinate of the calibration This should be the Y coordinate that positions the nozzle at the ending calibration position for the Y axis. This parameter must be provided if compensating for Y axis twist.",
    required: true,
  },
  calibrate_x: {
    type: { kind: "number" },
    description:
      "Defines the X coordinate of the calibration for Y axis twist compensation This should be the X coordinate that positions the nozzle during the calibration process for Y axis twist compensation. This parameter must be provided and is recommended to be near the center of the bed.",
    required: true,
  },
};

export const axisTwistCompensationSchema = createSchemaFromParams(axis_twist_compensationParams);

export const axisTwistCompensationDefinition: SectionDefinition<typeof axisTwistCompensationSchema> = {
  id: "axis_twist_compensation",
  naming: { kind: "fixed", header: "axis_twist_compensation" },
  schema: axisTwistCompensationSchema,
  params: axis_twist_compensationParams,
  order: 48,
  category: "Probing",
  label: "Axis Twist Compensation",
};
