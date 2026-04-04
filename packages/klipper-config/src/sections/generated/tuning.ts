import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const KNOWN_ACCEL_CHIPS = ["adxl345", "lis2dw", "lis3dh", "mpu9250", "bmi160", "icm20948"];

export const skew_correctionParams: SectionParams = {};

export const skewCorrectionSchema = createSchemaFromParams(skew_correctionParams);

export const skewCorrectionDefinition: SectionDefinition<typeof skewCorrectionSchema> = {
  id: "skew_correction",
  naming: { kind: "fixed", header: "skew_correction" },
  schema: skewCorrectionSchema,
  params: skew_correctionParams,
  order: 50,
  category: "Tuning",
  label: "Skew Correction",
};

export const input_shaperParams: SectionParams = {
  shaper_freq_x: {
    type: { kind: "number", min: 0 },
    description:
      "A frequency (in Hz) of the input shaper for X axis. This is usually a resonance frequency of X axis that the input shaper should suppress. For more complex shapers, like 2- and 3-hump EI input shapers, this parameter can be set from different considerations. The default value is 0, which disables input shaping for X axis.",
    required: false,
    default: 0,
  },
  shaper_freq_y: {
    type: { kind: "number", min: 0 },
    description:
      "A frequency (in Hz) of the input shaper for Y axis. This is usually a resonance frequency of Y axis that the input shaper should suppress. For more complex shapers, like 2- and 3-hump EI input shapers, this parameter can be set from different considerations. The default value is 0, which disables input shaping for Y axis.",
    required: false,
    default: 0,
  },
  shaper_freq_z: {
    type: { kind: "number", min: 0 },
    description:
      "A frequency (in Hz) of the input shaper for Z axis. The default value is 0, which disables input shaping for Z axis.",
    required: false,
    default: 0,
  },
  shaper_type: {
    type: { kind: "string" },
    description:
      "A type of the input shaper to use for all axes. Supported shapers are zv, mzv, zvd, ei, 2hump_ei, and 3hump_ei. The default is mzv input shaper.",
    required: false,
    default: "mzv",
  },
  shaper_type_x: {
    type: { kind: "string" },
    description: "shaper_type_x parameter",
    required: false,
  },
  shaper_type_y: {
    type: { kind: "string" },
    description: "shaper_type_y parameter",
    required: false,
  },
  shaper_type_z: {
    type: { kind: "string" },
    description:
      "If shaper_type is not set, these parameters can be used to configure different input shapers for X, Y, and Z axes. The same values are supported as for shaper_type parameter.",
    required: false,
  },
  damping_ratio_x: {
    type: { kind: "number", min: 0 },
    description: "damping_ratio_x parameter",
    required: false,
    default: 0.1,
  },
  damping_ratio_y: {
    type: { kind: "number", min: 0 },
    description: "damping_ratio_y parameter",
    required: false,
    default: 0.1,
  },
  damping_ratio_z: {
    type: { kind: "number", min: 0 },
    description:
      "Damping ratios of vibrations of X and Y axes used by input shapers to improve vibration suppression. Default value is 0.1 which is a good all-round value for most printers. In most circumstances this parameter requires no tuning and should not be changed.",
    required: false,
    default: 0.1,
  },
};

export const resonance_testerParams: SectionParams = {
  probe_points: {
    type: { kind: "string" },
    description:
      "A list of X, Y, Z coordinates of points (one point per line) to test resonances at. At least one point is required. Make sure that all points with some safety margin in XY plane (~a few centimeters) are reachable by the toolhead.",
    required: false,
  },
  accel_chip: {
    type: { kind: "choice", choices: KNOWN_ACCEL_CHIPS },
    description:
      'A name of the accelerometer chip to use for measurements. If an accelerometer was defined without an explicit name, this parameter can simply reference it by type, e.g. "accel_chip: adxl345", otherwise a full name must be supplied, e.g. "accel_chip: adxl345 my_chip_name". Either this, or the next two parameters must be set.',
    required: false,
  },
  accel_chip_x: {
    type: { kind: "choice", choices: KNOWN_ACCEL_CHIPS },
    description: "accel_chip_x parameter",
    required: false,
  },
  accel_chip_y: {
    type: { kind: "choice", choices: KNOWN_ACCEL_CHIPS },
    description:
      "Names of the accelerometer chips to use for measurements for each of the axis. Can be useful, for instance, on bed slinger printer, if two separate accelerometers are mounted on the bed (for Y axis) and on the toolhead (for X axis). These parameters have the same format as 'accel_chip' parameter. Only 'accel_chip' or these two parameters must be provided.",
    required: false,
  },
  accel_chip_z: {
    type: { kind: "choice", choices: KNOWN_ACCEL_CHIPS },
    description:
      "A name of the accelerometer chip to use for measurements of Z axis. This parameter has the same format as 'accel_chip'. The default is not to configure an accelerometer for Z axis.",
    required: false,
    default: "",
  },
  max_smoothing: {
    type: { kind: "number", min: 0.05 },
    description:
      "Maximum input shaper smoothing to allow for each axis during shaper auto-calibration (with 'SHAPER_CALIBRATE' command). By default no maximum smoothing is specified. Refer to Measuring_Resonances guide for more details on using this feature.",
    required: false,
  },
  move_speed: {
    type: { kind: "number", above: 0 },
    description:
      "The speed (in mm/s) to move the toolhead to and between test points during the calibration. The default is 50.",
    required: false,
    default: 50,
  },
  min_freq: {
    type: { kind: "number", min: 1 },
    description: "Minimum frequency to test for resonances. The default is 5 Hz.",
    required: false,
    default: 5,
  },
  max_freq: {
    type: { kind: "number", max: 300 },
    description: "Maximum frequency to test for resonances. The default is 135 Hz.",
    required: false,
    default: 135,
  },
  max_freq_z: {
    type: { kind: "number", max: 300 },
    description: "Maximum frequency to test Z axis for resonances. The default is 100 Hz.",
    required: false,
    default: 100,
  },
  accel_per_hz: {
    type: { kind: "number", above: 0 },
    description:
      "This parameter is used to determine which acceleration to use to test a specific frequency: accel = accel_per_hz * freq. Higher the value, the higher is the energy of the oscillations. Can be set to a lower than the default value if the resonances get too strong on the printer. However, lower values make measurements of high-frequency resonances less precise. The default value is 60 (mm/sec).",
    required: false,
    default: 60,
  },
  accel_per_hz_z: {
    type: { kind: "number", above: 0 },
    description:
      "This parameter has the same meaning as accel_per_hz, but applies to Z axis specifically. The default is 15 (mm/sec).",
    required: false,
    default: 15,
  },
  hz_per_sec: {
    type: { kind: "number", min: 0.1, max: 2 },
    description:
      "Determines the speed of the test. When testing all frequencies in range [min_freq, max_freq], each second the frequency increases by hz_per_sec. Small values make the test slow, and the large values will decrease the precision of the test. The default value is 1.0 (Hz/sec == sec^-2).",
    required: false,
    default: 1,
  },
  sweeping_accel: {
    type: { kind: "number", above: 0 },
    description: "An acceleration of slow sweeping moves. The default is 400 mm/sec^2.",
    required: false,
    default: 400,
  },
  sweeping_accel_z: {
    type: { kind: "number", above: 0 },
    description: "Same as sweeping_accel above, but for Z axis. The default is 50 mm/sec^2.",
    required: false,
    default: 50,
  },
  sweeping_period: {
    type: { kind: "number", min: 0 },
    description:
      "A period of slow sweeping moves. Setting this parameter to 0 disables slow sweeping moves. Avoid setting it to a too small non-zero value in order to not poison the measurements. The default is 1.2 sec which is a good all-round choice.",
    required: false,
    default: 1.2,
  },
};

export const resonanceTesterSchema = createSchemaFromParams(resonance_testerParams);

export const resonanceTesterDefinition: SectionDefinition<typeof resonanceTesterSchema> = {
  id: "resonance_tester",
  naming: { kind: "fixed", header: "resonance_tester" },
  schema: resonanceTesterSchema,
  params: resonance_testerParams,
  order: 52,
  category: "Tuning",
  label: "Resonance Tester",
};
