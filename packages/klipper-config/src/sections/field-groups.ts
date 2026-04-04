import type { ParamDefinition } from "./param-types";

export interface FieldGroup {
  label: string;
  fields: string[];
  sections?: string[];
}

// Field groups: fields that should appear together, in this order.
// Applied to any section that contains the anchor (first) field.
const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Thermistor",
    fields: ["sensor_type", "sensor_pin", "pullup_resistor"],
  },
  {
    label: "Heater",
    fields: ["heater_pin"],
  },
  {
    label: "Motor",
    fields: ["full_steps_per_rotation", "rotation_distance", "gear_ratio", "microsteps"],
  },
  {
    label: "Driver",
    fields: ["step_pin", "dir_pin", "enable_pin", "step_pulse_duration"],
    sections: ["stepper", "extruder"],
  },
  {
    label: "Driver",
    fields: ["cs_pin", "diag0_pin", "diag1_pin", "interpolate"],
    sections: ["tmc2209", "tmc5160", "tmc2130", "tmc2208", "tmc2240", "tmc2660", "adxl345", "icm20948"],
  },
  {
    label: "Accelerometer",
    fields: ["axes_map"],
  },
  {
    label: "Communication",
    fields: [
      "uart_pin",
      "spi_bus",
      "spi_speed",
      "spi_software_sclk_pin",
      "spi_software_mosi_pin",
      "spi_software_miso_pin",
      "spi_speed",
      "rate",
      "i2c_address",
      "i2c_mcu",
      "i2c_bus",
      "i2c_software_scl_pin",
      "i2c_software_sda_pin",
      "i2c_speed",
    ],
    sections: [
      "tmc2209",
      "tmc5160",
      "tmc2130",
      "tmc2208",
      "tmc2240",
      "tmc2660",
      "adxl345",
      "icm20948",
      "lis2dw",
      "lis3dh",
      "bmi160",
      "mpu9250",
    ],
  },
  {
    label: "Extruder",
    fields: ["nozzle_diameter", "filament_diameter"],
  },
  {
    label: "Endstop",
    fields: ["endstop_pin", "position_endstop"],
  },
  {
    label: "Movement Limits",
    fields: ["position_min", "position_max"],
  },
  {
    label: "Homing",
    fields: [
      "homing_speed",
      "homing_retract_dist",
      "homing_retract_speed",
      "second_homing_speed",
      "homing_positive_dir",
    ],
  },
  {
    label: "Extruder Limits",
    fields: [
      "instantaneous_corner_velocity",
      "max_extrude_cross_section",
      "max_extrude_only_distance",
      "max_extrude_only_velocity",
      "max_extrude_only_accel",
    ],
  },
  {
    label: "Pressure Advance",
    fields: ["pressure_advance", "pressure_advance_smooth_time"],
  },
  {
    label: "Temperature Control",
    fields: [
      "control",
      "pid_kp",
      "pid_ki",
      "pid_kd",
      "pid_deriv_time",
      "max_delta",
      "min_temp",
      "max_temp",
      "min_extrude_temp",
    ],
  },
  {
    label: "Fan Control",
    fields: ["shutdown_speed", "kick_start_time", "off_below"],
  },
  {
    label: "Fan Tachometer",
    fields: ["tachometer_pin", "tachometer_ppr", "tachometer_poll_interval"],
  },
  {
    label: "Power Control",
    fields: ["max_power", "smooth_time", "pwm_cycle_time", "run_current", "hold_current", "sense_resistor", "rref"],
  },
  {
    label: "Features",
    fields: ["stealthchop_threshold", "coolstep_threshold", "high_velocity_threshold"],
  },
  {
    label: "IO",
    fields: ["pin", "chain_position", "chain_length"],
  },
  {
    label: "IO",
    fields: ["pin", "enable_pin", "cycle_time", "hardware_pwm"],
    sections: ["fan", "heater_fan", "controller_fan", "fan_generic"],
  },
  {
    label: "IO",
    fields: ["pin", "pwm", "hardware_pwm", "cycle_time"],
    sections: ["output_pin"],
  },
  {
    label: "Output",
    fields: ["value", "scale", "shutdown_value", "cycle_time"],
    sections: ["output_pin", "pwm_cycle_time"],
  },
  {
    label: "LED",
    fields: ["chain_count", "color_order", "initial_red", "initial_green", "initial_blue", "initial_white"],
  },
  {
    label: "Combined Sensor",
    fields: ["sensor_list", "combination_method", "maximum_deviation"],
    sections: ["temperature_sensor"],
  },
  {
    label: "Misc",
    fields: ["gcode_id"],
  },
  {
    label: "Communication",
    fields: ["serial", "canbus_uuid", "canbus_interface", "baud", "restart_method"],
    sections: ["mcu", "mcu_named"],
  },
  {
    label: "Shaper",
    fields: ["shaper_type"],
  },
  {
    label: "Shaper X",
    fields: ["shaper_freq_x", "shaper_type_x", "damping_ratio_x"],
  },
  {
    label: "Shaper Y",
    fields: ["shaper_freq_y", "shaper_type_y", "damping_ratio_y"],
  },
  {
    label: "Shaper Z",
    fields: ["shaper_freq_z", "shaper_type_z", "damping_ratio_z"],
  },
  {
    label: "Retract",
    fields: ["retract_length", "retract_speed"],
  },
  {
    label: "Unretract",
    fields: ["unretract_extra_length", "unretract_speed"],
  },
];

/**
 * Reorders param entries so grouped fields are adjacent.
 * Groups are inserted at the position of the first member found.
 * Fields not in any group retain their relative order.
 */
const CONTROL_VISIBILITY: Record<string, ParamDefinition["visibleWhen"]> = {
  pid_kp: { field: "control", value: "pid" },
  pid_ki: { field: "control", value: "pid" },
  pid_kd: { field: "control", value: "pid" },
  pid_deriv_time: { field: "control", value: "pid" },
  max_delta: { field: "control", value: "watermark" },
};

/**
 * Injects `visibleWhen` on PID / watermark fields when a `control` field is present.
 */
export function applyControlVisibility(fields: [string, ParamDefinition][]): [string, ParamDefinition][] {
  const hasControl = fields.some(([name]) => name === "control");
  if (!hasControl) return fields;

  return fields.map(([name, param]) => {
    const rule = CONTROL_VISIBILITY[name];
    if (!rule) return [name, param];
    return [name, { ...param, visibleWhen: rule }];
  });
}
export function applyFieldGroups(fields: [string, ParamDefinition][], sectionId?: string): [string, ParamDefinition][] {
  let result = [...fields];

  const applicableGroups = FIELD_GROUPS.filter((g) => !g.sections || (sectionId && g.sections.includes(sectionId)));

  for (const group of applicableGroups) {
    const groupSet = new Set(group.fields);
    const inGroup = result.filter(([name]) => groupSet.has(name));
    if (inGroup.length < 2) continue;

    inGroup.sort((a, b) => group.fields.indexOf(a[0]) - group.fields.indexOf(b[0]));

    const firstIdx = result.findIndex(([name]) => groupSet.has(name));
    result = result.filter(([name]) => !groupSet.has(name));
    result.splice(firstIdx, 0, ...inGroup);
  }

  return result;
}

const SENSOR_TYPE_VISIBILITY: Record<string, ParamDefinition["visibleWhen"]> = {
  sensor_list: { field: "sensor_type", value: "temperature_combined" },
  combination_method: { field: "sensor_type", value: "temperature_combined" },
  maximum_deviation: { field: "sensor_type", value: "temperature_combined" },
};

const SENSOR_TYPE_HIDDEN: Record<string, ParamDefinition["hiddenWhen"]> = {
  sensor_pin: { field: "sensor_type", value: "temperature_combined" },
};

/**
 * Injects `visibleWhen` on temperature_combined fields and `hiddenWhen` on sensor_pin
 * when a `sensor_type` field is present in a temperature_sensor section.
 */
export function applySensorTypeVisibility(fields: [string, ParamDefinition][]): [string, ParamDefinition][] {
  const hasSensorType = fields.some(([name]) => name === "sensor_type");
  const hasSensorList = fields.some(([name]) => name === "sensor_list");
  if (!hasSensorType || !hasSensorList) return fields;

  return fields.map(([name, param]) => {
    const visRule = SENSOR_TYPE_VISIBILITY[name];
    const hidRule = SENSOR_TYPE_HIDDEN[name];
    if (!visRule && !hidRule) return [name, param];
    return [name, { ...param, ...(visRule && { visibleWhen: visRule }), ...(hidRule && { hiddenWhen: hidRule }) }];
  });
}

export function getFieldGroup(fieldName: string, sectionId?: string): FieldGroup | undefined {
  const matches = FIELD_GROUPS.filter((g) => g.fields.includes(fieldName));
  if (matches.length === 0) return undefined;

  if (sectionId) {
    const scoped = matches.find((g) => g.sections?.includes(sectionId));
    if (scoped) return scoped;
  }

  return matches.find((g) => !g.sections) ?? undefined;
}
