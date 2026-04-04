import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const bed_meshParams: SectionParams = {
  speed: {
    type: { kind: "number", above: 0 },
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
  mesh_radius: {
    type: { kind: "number", above: 0 },
    description:
      "Defines the radius of the mesh to probe for round beds. Note that the radius is relative to the coordinate specified by the mesh_origin option. This parameter must be provided for round beds and omitted for rectangular beds.",
    required: false,
  },
  mesh_origin: {
    type: { kind: "string" },
    description:
      "Defines the center X, Y coordinate of the mesh for round beds. This coordinate is relative to the probe's location. It may be useful to adjust the mesh_origin in an effort to maximize the size of the mesh radius. Default is 0, 0. This parameter must be omitted for rectangular beds.",
    required: false,
    default: 0,
  },
  mesh_min: {
    type: { kind: "string" },
    description:
      "Defines the minimum X, Y coordinate of the mesh for rectangular beds. This coordinate is relative to the probe's location. This will be the first point probed, nearest to the origin. This parameter must be provided for rectangular beds.",
    required: false,
  },
  mesh_max: {
    type: { kind: "string" },
    description:
      "Defines the maximum X, Y coordinate of the mesh for rectangular beds. Adheres to the same principle as mesh_min, however this will be the furthest point probed from the bed's origin. This parameter must be provided for rectangular beds.",
    required: false,
  },
  probe_count: {
    type: { kind: "number", integer: true },
    description:
      "For rectangular beds, this is a comma separate pair of integer values X, Y defining the number of points to probe along each axis. A single value is also valid, in which case that value will be applied to both axes. Default is 3, 3.",
    required: false,
  },
  round_probe_count: {
    type: { kind: "number", integer: true, min: 3 },
    description:
      "For round beds, this integer value defines the maximum number of points to probe along each axis. This value must be an odd number. Default is 5.",
    required: false,
    default: 5,
  },
  fade_start: {
    type: { kind: "number" },
    description:
      "The gcode z position in which to start phasing out z-adjustment when fade is enabled. Default is 1.0.",
    required: false,
    default: 1,
  },
  fade_end: {
    type: { kind: "number" },
    description:
      "The gcode z position in which phasing out completes. When set to a value below fade_start, fade is disabled. It should be noted that fade may add unwanted scaling along the z-axis of a print. If a user wishes to enable fade, a value of 10.0 is recommended. Default is 0.0, which disables fade.",
    required: false,
    default: 0,
  },
  fade_target: {
    type: { kind: "number" },
    description:
      "The z position in which fade should converge. When this value is set to a non-zero value it must be within the range of z-values in the mesh. Users that wish to converge to the z homing position should set this to 0. Default is the average z value of the mesh.",
    required: false,
  },
  split_delta_z: {
    type: { kind: "number", min: 0.01 },
    description: "The amount of Z difference (in mm) along a move that will trigger a split. Default is .025.",
    required: false,
  },
  move_check_distance: {
    type: { kind: "number", min: 3 },
    description:
      "The distance (in mm) along a move to check for split_delta_z. This is also the minimum length that a move can be split. Default is 5.0.",
    required: false,
    default: 5,
  },
  mesh_pps: {
    type: { kind: "string" },
    description:
      'A comma separated pair of integers X, Y defining the number of points per segment to interpolate in the mesh along each axis. A "segment" can be defined as the space between each probed point. The user may enter a single value which will be applied to both axes. Default is 2, 2.',
    required: false,
  },
  algorithm: {
    type: { kind: "string" },
    description:
      'The interpolation algorithm to use. May be either "lagrange" or "bicubic". This option will not affect 3x3 grids, which are forced to use lagrange sampling. Default is lagrange.',
    required: false,
    default: "lagrange",
  },
  bicubic_tension: {
    type: { kind: "number", min: 0, max: 2 },
    description:
      "When using the bicubic algorithm the tension parameter above may be applied to change the amount of slope interpolated. Larger numbers will increase the amount of slope, which results in more curvature in the mesh. Default is .2.",
    required: false,
  },
  zero_reference_position: {
    type: { kind: "string" },
    description:
      "An optional X,Y coordinate that specifies the location on the bed where Z = 0. When this option is specified the mesh will be offset so that zero Z adjustment occurs at this location. The default is no zero reference.",
    required: false,
  },
  faulty_region_1_min: {
    type: { kind: "string" },
    description: "faulty_region_1_min parameter",
    required: false,
  },
  faulty_region_1_max: {
    type: { kind: "string" },
    description:
      "Optional points that define a faulty region. See docs/Bed_Mesh.md for details on faulty regions. Up to 99 faulty regions may be added. By default no faulty regions are set.",
    required: false,
  },
  adaptive_margin: {
    type: { kind: "number" },
    description:
      "An optional margin (in mm) to be added around the bed area used by the defined print objects when generating an adaptive mesh.",
    required: false,
    default: 0,
  },
  scan_overshoot: {
    type: { kind: "number", min: 1 },
    description:
      'The maximum amount of travel (in mm) available outside of the mesh. For rectangular beds this applies to travel on the X axis, and for round beds it applies to the entire radius. The tool must be able to travel the amount specified outside of the mesh. This value is used to optimize the travel path when performing a "rapid scan". The minimum value that may be specified is 1. The default is no overshoot.',
    required: false,
    default: 0,
  },
};

export const bed_tiltParams: SectionParams = {
  x_adjust: {
    type: { kind: "number" },
    description: "The amount to add to each move's Z height for each mm on the X axis. The default is 0.",
    required: false,
    default: 0,
  },
  y_adjust: {
    type: { kind: "number" },
    description: "The amount to add to each move's Z height for each mm on the Y axis. The default is 0.",
    required: false,
    default: 0,
  },
  z_adjust: {
    type: { kind: "number" },
    description:
      "The amount to add to the Z height when the nozzle is nominally at 0, 0. The default is 0. The remaining parameters control a BED_TILT_CALIBRATE extended g-code command that may be used to calibrate appropriate x and y adjustment parameters.",
    required: false,
    default: 0,
  },
  points: {
    type: { kind: "string" },
    description:
      "A list of X, Y coordinates (one per line; subsequent lines indented) that should be probed during a BED_TILT_CALIBRATE command. Specify coordinates of the nozzle and be sure the probe is above the bed at the given nozzle coordinates. The default is to not enable the command.",
    required: false,
  },
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
};

export const bedTiltSchema = createSchemaFromParams(bed_tiltParams);

export const bedTiltDefinition: SectionDefinition<typeof bedTiltSchema> = {
  id: "bed_tilt",
  naming: { kind: "fixed", header: "bed_tilt" },
  schema: bedTiltSchema,
  params: bed_tiltParams,
  order: 48,
  category: "Leveling",
  label: "Bed Tilt",
};

export const bed_screwsParams: SectionParams = {
  screw1: {
    type: { kind: "string" },
    description:
      "The X, Y coordinate of the first bed leveling screw. This is a position to command the nozzle to that is directly above the bed screw (or as close as possible while still being above the bed). This parameter must be provided.",
    required: false,
  },
  screw1_name: {
    type: { kind: "string" },
    description:
      "An arbitrary name for the given screw. This name is displayed when the helper script runs. The default is to use a name based upon the screw XY location.",
    required: false,
  },
  screw1_fine_adjust: {
    type: { kind: "string" },
    description:
      "An X, Y coordinate to command the nozzle to so that one can fine tune the bed leveling screw. The default is to not perform fine adjustments on the bed screw.",
    required: false,
  },
  screw2: {
    type: { kind: "string" },
    description: "screw2 parameter",
    required: false,
  },
  screw2_name: {
    type: { kind: "string" },
    description: "screw2_name parameter",
    required: false,
  },
  screw2_fine_adjust: {
    type: { kind: "string" },
    description: "... Additional bed leveling screws. At least three screws must be defined.",
    required: false,
  },
  horizontal_move_z: {
    type: { kind: "number" },
    description:
      "The height (in mm) that the head should be commanded to move to when moving from one screw location to the next. The default is 5.",
    required: false,
    default: 5,
  },
  probe_height: {
    type: { kind: "number" },
    description:
      "The height of the probe (in mm) after adjusting for the thermal expansion of bed and nozzle. The default is zero.",
    required: false,
    default: 0,
  },
  speed: {
    type: { kind: "number", above: 0 },
    description: "The speed (in mm/s) of non-probing moves during the calibration. The default is 50.",
    required: false,
    default: 50,
  },
  probe_speed: {
    type: { kind: "number", above: 0 },
    description:
      "The speed (in mm/s) when moving from a horizontal_move_z position to a probe_height position. The default is 5.",
    required: false,
    default: 5,
  },
};

export const bedScrewsSchema = createSchemaFromParams(bed_screwsParams);

export const bedScrewsDefinition: SectionDefinition<typeof bedScrewsSchema> = {
  id: "bed_screws",
  naming: { kind: "fixed", header: "bed_screws" },
  schema: bedScrewsSchema,
  params: bed_screwsParams,
  allowedFieldPattern: /^screw\d+(_name|_fine_adjust)?$/,
  order: 48,
  category: "Leveling",
  label: "Bed Screws",
};

export const screws_tilt_adjustParams: SectionParams = {
  screw1: {
    type: { kind: "string" },
    description:
      "The (X, Y) coordinate of the first bed leveling screw. This is a position to command the nozzle to so that the probe is directly above the bed screw (or as close as possible while still being above the bed). This is the base screw used in calculations. This parameter must be provided.",
    required: false,
  },
  screw1_name: {
    type: { kind: "string" },
    description:
      "An arbitrary name for the given screw. This name is displayed when the helper script runs. The default is to use a name based upon the screw XY location.",
    required: false,
  },
  screw2: {
    type: { kind: "string" },
    description: "screw2 parameter",
    required: false,
  },
  screw2_name: {
    type: { kind: "string" },
    description: "... Additional bed leveling screws. At least two screws must be defined.",
    required: false,
  },
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
  screw_thread: {
    type: { kind: "string" },
    description:
      "The type of screw used for bed leveling, M3, M4, or M5, and the rotation direction of the knob that is used to level the bed. Accepted values: CW-M3, CCW-M3, CW-M4, CCW-M4, CW-M5, CCW-M5. Default value is CW-M3 which most printers use. A clockwise rotation of the knob decreases the gap between the nozzle and the bed. Conversely, a counter-clockwise rotation increases the gap.",
    required: false,
  },
};

export const screwsTiltAdjustSchema = createSchemaFromParams(screws_tilt_adjustParams);

export const screwsTiltAdjustDefinition: SectionDefinition<typeof screwsTiltAdjustSchema> = {
  id: "screws_tilt_adjust",
  naming: { kind: "fixed", header: "screws_tilt_adjust" },
  schema: screwsTiltAdjustSchema,
  params: screws_tilt_adjustParams,
  allowedFieldPattern: /^screw\d+(_name)?$/,
  order: 48,
  category: "Leveling",
  label: "Screws Tilt Adjust",
};

export const z_tiltParams: SectionParams = {
  z_positions: {
    type: { kind: "string" },
    description:
      'A list of X, Y coordinates (one per line; subsequent lines indented) describing the location of each bed "pivot point". The "pivot point" is the point where the bed attaches to the given Z stepper. It is described using nozzle coordinates (the X, Y position of the nozzle if it could move directly above the point). The first entry corresponds to stepper_z, the second to stepper_z1, the third to stepper_z2, etc. This parameter must be provided.',
    required: false,
  },
  points: {
    type: { kind: "string" },
    description:
      "A list of X, Y coordinates (one per line; subsequent lines indented) that should be probed during a Z_TILT_ADJUST command. Specify coordinates of the nozzle and be sure the probe is above the bed at the given nozzle coordinates. This parameter must be provided.",
    required: false,
  },
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
  retries: {
    type: { kind: "number", integer: true, min: 0 },
    description: "Number of times to retry if the probed points aren't within tolerance.",
    required: false,
    default: 0,
  },
  retry_tolerance: {
    type: { kind: "number", above: 0 },
    description:
      "If retries are enabled then retry if largest and smallest probed points differ more than retry_tolerance. Note the smallest unit of change here would be a single step. However if you are probing more points than steppers then you will likely have a fixed minimum value for the range of probed points which you can learn by observing command output.",
    required: false,
    default: 0,
  },
};

export const zTiltSchema = createSchemaFromParams(z_tiltParams);

export const zTiltDefinition: SectionDefinition<typeof zTiltSchema> = {
  id: "z_tilt",
  naming: { kind: "fixed", header: "z_tilt" },
  schema: zTiltSchema,
  params: z_tiltParams,
  order: 48,
  category: "Leveling",
  label: "Z Tilt",
};

export const quad_gantry_levelParams: SectionParams = {
  gantry_corners: {
    type: { kind: "string" },
    description:
      "A newline separated list of X, Y coordinates describing the two opposing corners of the gantry. The first entry corresponds to Z, the second to Z2. This parameter must be provided.",
    required: false,
  },
  points: {
    type: { kind: "string" },
    description:
      "A newline separated list of four X, Y points that should be probed during a QUAD_GANTRY_LEVEL command. Order of the locations is important, and should correspond to Z, Z1, Z2, and Z3 location in order. This parameter must be provided. For maximum accuracy, ensure your probe offsets are configured.",
    required: false,
  },
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
  max_adjust: {
    type: { kind: "number", above: 0 },
    description: "Safety limit if an adjustment greater than this value is requested quad_gantry_level will abort.",
    required: false,
    default: 4,
  },
  retries: {
    type: { kind: "number", integer: true, min: 0 },
    description: "Number of times to retry if the probed points aren't within tolerance.",
    required: false,
    default: 0,
  },
  retry_tolerance: {
    type: { kind: "number", above: 0 },
    description:
      "If retries are enabled then retry if largest and smallest probed points differ more than retry_tolerance.",
    required: false,
    default: 0,
  },
};

export const quadGantryLevelSchema = createSchemaFromParams(quad_gantry_levelParams);

export const quadGantryLevelDefinition: SectionDefinition<typeof quadGantryLevelSchema> = {
  id: "quad_gantry_level",
  naming: { kind: "fixed", header: "quad_gantry_level" },
  schema: quadGantryLevelSchema,
  params: quad_gantry_levelParams,
  order: 48,
  category: "Leveling",
  label: "Quad Gantry Level",
};

export const z_thermal_adjustParams: SectionParams = {
  temp_coeff: {
    type: { kind: "number", min: -1, max: 1 },
    description:
      "The temperature coefficient of expansion, in mm/degC. For example, a temp_coeff of 0.01 mm/degC will move the Z axis downwards by 0.01 mm for every degree Celsius that the temperature sensor increases. Defaults to 0.0 mm/degC, which applies no adjustment.",
    required: false,
  },
  smooth_time: {
    type: { kind: "number", above: 0 },
    description:
      "Smoothing window applied to the temperature sensor, in seconds. Can reduce motor noise from excessive small corrections in response to sensor noise. The default is 2.0 seconds.",
    required: false,
    default: 2,
  },
  z_adjust_off_above: {
    type: { kind: "number" },
    description:
      "Disables adjustments above this Z height [mm]. The last computed correction will remain applied until the toolhead moves below the specified Z height again. The default is 99999999.0 mm (always on).",
    required: false,
    default: 99999999,
  },
  max_z_adjustment: {
    type: { kind: "number" },
    description:
      "Maximum absolute adjustment that can be applied to the Z axis [mm]. The default is 99999999.0 mm (unlimited).",
    required: false,
    default: 99999999,
  },
  sensor_type: {
    type: { kind: "string" },
    description: "sensor_type parameter",
    required: false,
  },
  sensor_pin: {
    type: { kind: "string" },
    description: "sensor_pin parameter",
    required: false,
  },
  min_temp: {
    type: { kind: "number" },
    description: "min_temp parameter",
    required: false,
  },
  max_temp: {
    type: { kind: "number" },
    description:
      'Temperature sensor configuration. See the "extruder" section for the definition of the above parameters.',
    required: false,
  },
  gcode_id: {
    type: { kind: "string" },
    description: 'See the "heater_generic" section for the definition of this parameter.',
    required: false,
  },
};

export const zThermalAdjustSchema = createSchemaFromParams(z_thermal_adjustParams);

export const zThermalAdjustDefinition: SectionDefinition<typeof zThermalAdjustSchema> = {
  id: "z_thermal_adjust",
  naming: { kind: "fixed", header: "z_thermal_adjust" },
  schema: zThermalAdjustSchema,
  params: z_thermal_adjustParams,
  order: 48,
  category: "Leveling",
  label: "Z Thermal Adjust",
};
