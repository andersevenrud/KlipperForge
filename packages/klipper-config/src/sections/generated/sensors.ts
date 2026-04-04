import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const adxl345Params: SectionParams = {
  cs_pin: {
    type: { kind: "string" },
    description: "The SPI enable pin for the sensor. This parameter must be provided.",
    required: true,
  },
  spi_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: "The SPI speed (in hz) to use when communicating with the chip. The default is 5000000.",
    required: false,
    default: 5000000,
  },
  spi_bus: {
    type: { kind: "string" },
    description: "spi_bus parameter",
    required: false,
  },
  spi_software_sclk_pin: {
    type: { kind: "string" },
    description: "spi_software_sclk_pin parameter",
    required: false,
  },
  spi_software_mosi_pin: {
    type: { kind: "string" },
    description: "spi_software_mosi_pin parameter",
    required: false,
  },
  spi_software_miso_pin: {
    type: { kind: "string" },
    description: 'See the "common SPI settings" section for a description of the above parameters.',
    required: false,
  },
  axes_map: {
    type: { kind: "string" },
    description:
      'The accelerometer axis for each of the printer\'s X, Y, and Z axes. This may be useful if the accelerometer is mounted in an orientation that does not match the printer orientation. For example, one could set this to "y, x, z" to swap the X and Y axes. It is also possible to negate an axis if the accelerometer direction is reversed (eg, "x, z, -y"). The default is "x, y, z".',
    required: false,
  },
  rate: {
    type: { kind: "number", integer: true },
    description:
      "Output data rate for ADXL345. ADXL345 supports the following data rates: 3200, 1600, 800, 400, 200, 100, 50, and 25. Note that it is not recommended to change this rate from the default 3200, and rates below 800 will considerably affect the quality of resonance measurements.",
    required: false,
    default: 3200,
  },
};

export const adxl345Schema = createSchemaFromParams(adxl345Params);

export const adxl345Definition: SectionDefinition<typeof adxl345Schema> = {
  id: "adxl345",
  naming: { kind: "fixed", header: "adxl345" },
  schema: adxl345Schema,
  params: adxl345Params,
  order: 53,
  category: "Sensors",
  label: "ADXL345",
};

export const icm20948Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "Default is 104 (0x68). If AD0 is high, it would be 0x69 instead.",
    required: false,
    default: 104,
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
      'See the "common I2C settings" section for a description of the above parameters. The default "i2c_speed" is 400000.',
    required: false,
    default: 400000,
  },
  axes_map: {
    type: { kind: "string" },
    description: 'See the "adxl345" section for information on this parameter.',
    required: false,
  },
};

export const icm20948Schema = createSchemaFromParams(icm20948Params);

export const icm20948Definition: SectionDefinition<typeof icm20948Schema> = {
  id: "icm20948",
  naming: { kind: "fixed", header: "icm20948" },
  schema: icm20948Schema,
  params: icm20948Params,
  order: 53,
  category: "Sensors",
  label: "ICM20948",
};

export const lis2dwParams: SectionParams = {
  cs_pin: {
    type: { kind: "string" },
    description: "The SPI enable pin for the sensor. This parameter must be provided if using SPI.",
    required: false,
  },
  spi_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: "The SPI speed (in hz) to use when communicating with the chip. The default is 5000000.",
    required: false,
    default: 5000000,
  },
  spi_bus: {
    type: { kind: "string" },
    description: "spi_bus parameter",
    required: false,
  },
  spi_software_sclk_pin: {
    type: { kind: "string" },
    description: "spi_software_sclk_pin parameter",
    required: false,
  },
  spi_software_mosi_pin: {
    type: { kind: "string" },
    description: "spi_software_mosi_pin parameter",
    required: false,
  },
  spi_software_miso_pin: {
    type: { kind: "string" },
    description: 'See the "common SPI settings" section for a description of the above parameters.',
    required: false,
  },
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "Default is 25 (0x19). If SA0 is high, it would be 24 (0x18) instead.",
    required: false,
    default: 25,
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
      'See the "common I2C settings" section for a description of the above parameters. The default "i2c_speed" is 400000.',
    required: false,
    default: 400000,
  },
  axes_map: {
    type: { kind: "string" },
    description: 'See the "adxl345" section for information on this parameter.',
    required: false,
  },
};

export const lis2dwSchema = createSchemaFromParams(lis2dwParams);

export const lis2dwDefinition: SectionDefinition<typeof lis2dwSchema> = {
  id: "lis2dw",
  naming: { kind: "fixed", header: "lis2dw" },
  schema: lis2dwSchema,
  params: lis2dwParams,
  order: 53,
  category: "Sensors",
  label: "LIS2DW",
};

export const lis3dhParams: SectionParams = {
  cs_pin: {
    type: { kind: "string" },
    description: "The SPI enable pin for the sensor. This parameter must be provided if using SPI.",
    required: false,
  },
  spi_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: "The SPI speed (in hz) to use when communicating with the chip. The default is 5000000.",
    required: false,
    default: 5000000,
  },
  spi_bus: {
    type: { kind: "string" },
    description: "spi_bus parameter",
    required: false,
  },
  spi_software_sclk_pin: {
    type: { kind: "string" },
    description: "spi_software_sclk_pin parameter",
    required: false,
  },
  spi_software_mosi_pin: {
    type: { kind: "string" },
    description: "spi_software_mosi_pin parameter",
    required: false,
  },
  spi_software_miso_pin: {
    type: { kind: "string" },
    description: 'See the "common SPI settings" section for a description of the above parameters.',
    required: false,
  },
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "Default is 25 (0x19). If SA0 is high, it would be 24 (0x18) instead.",
    required: false,
    default: 25,
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
      'See the "common I2C settings" section for a description of the above parameters. The default "i2c_speed" is 400000.',
    required: false,
    default: 400000,
  },
  axes_map: {
    type: { kind: "string" },
    description: 'See the "adxl345" section for information on this parameter.',
    required: false,
  },
};

export const lis3dhSchema = createSchemaFromParams(lis3dhParams);

export const lis3dhDefinition: SectionDefinition<typeof lis3dhSchema> = {
  id: "lis3dh",
  naming: { kind: "fixed", header: "lis3dh" },
  schema: lis3dhSchema,
  params: lis3dhParams,
  order: 53,
  category: "Sensors",
  label: "LIS3DH",
};

export const bmi160Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "Default is 105 (0x69). If SA0 is tied to GND, use 104 (0x68). Only used for I2C.",
    required: false,
    default: 105,
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
  i2c_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: 'See the "common I2C settings" section for a description of the above parameters. Only used for I2C.',
    required: false,
  },
  cs_pin: {
    type: { kind: "string" },
    description: "cs_pin parameter",
    required: false,
  },
  spi_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: "spi_speed parameter",
    required: false,
  },
  spi_bus: {
    type: { kind: "string" },
    description: "spi_bus parameter",
    required: false,
  },
  spi_software_sclk_pin: {
    type: { kind: "string" },
    description: "spi_software_sclk_pin parameter",
    required: false,
  },
  spi_software_mosi_pin: {
    type: { kind: "string" },
    description: "spi_software_mosi_pin parameter",
    required: false,
  },
  spi_software_miso_pin: {
    type: { kind: "string" },
    description: 'See the "common SPI settings" section for a description of the above parameters. Only used for SPI.',
    required: false,
  },
  axes_map: {
    type: { kind: "string" },
    description: 'See the "adxl345" section for information on this parameter.',
    required: false,
  },
};

export const bmi160Schema = createSchemaFromParams(bmi160Params);

export const bmi160Definition: SectionDefinition<typeof bmi160Schema> = {
  id: "bmi160",
  naming: { kind: "fixed", header: "bmi160" },
  schema: bmi160Schema,
  params: bmi160Params,
  order: 53,
  category: "Sensors",
  label: "BMI160",
};

export const mpu9250Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description: "Default is 104 (0x68). If AD0 is high, it would be 0x69 instead.",
    required: false,
    default: 104,
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
      'See the "common I2C settings" section for a description of the above parameters. The default "i2c_speed" is 400000.',
    required: false,
    default: 400000,
  },
  axes_map: {
    type: { kind: "string" },
    description: 'See the "adxl345" section for information on this parameter.',
    required: false,
  },
};

export const mpu9250Schema = createSchemaFromParams(mpu9250Params);

export const mpu9250Definition: SectionDefinition<typeof mpu9250Schema> = {
  id: "mpu9250",
  naming: { kind: "named", prefix: "mpu9250" },
  schema: mpu9250Schema,
  params: mpu9250Params,
  order: 53,
  category: "Sensors",
  label: "MPU9250",
};

export const temperature_sensorParams: SectionParams = {
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
    description: 'See the "extruder" section for the definition of the above parameters.',
    required: false,
    default: 99999999.9,
  },
  gcode_id: {
    type: { kind: "string" },
    description: 'See the "heater_generic" section for the definition of this parameter.',
    required: false,
  },
};

export const temperature_probeParams: SectionParams = {
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
    default: 99999999.9,
  },
  smooth_time: {
    type: { kind: "number", above: 0 },
    description:
      "A time value (in seconds) over which temperature measurements will be smoothed to reduce the impact of measurement noise. The default is 2.0 seconds.",
    required: false,
    default: 2,
  },
  gcode_id: {
    type: { kind: "string" },
    description: 'See the "heater_generic" section for the definition of this parameter.',
    required: false,
  },
  speed: {
    type: { kind: "number", above: 0 },
    description: "The travel speed [mm/s] for xy moves during calibration. Default is the speed defined by the probe.",
    required: false,
  },
  horizontal_move_z: {
    type: { kind: "number", above: 0 },
    description: "The z distance [mm] from the bed at which xy moves will occur during calibration. Default is 2mm.",
    required: false,
    default: 2,
  },
  resting_z: {
    type: { kind: "number", above: 0 },
    description:
      "The z distance [mm] from the bed at which the tool will rest to heat the probe coil during calibration. Default is .4mm",
    required: false,
  },
  calibration_position: {
    type: { kind: "string" },
    description:
      "The X, Y, Z position where the tool should be moved when probe drift calibration initializes. This is the location where the first manual probe will occur. If omitted, the default behavior is not to move the tool prior to the first manual probe.",
    required: false,
  },
  calibration_bed_temp: {
    type: { kind: "number", above: 50 },
    description:
      "The maximum safe bed temperature (in C) used to heat the probe during probe drift calibration. When set, the calibration procedure will turn on the bed after the first sample is taken. When the calibration procedure is complete the bed temperature will be set to zero. When omitted the default behavior is not to set the bed temperature.",
    required: false,
  },
  calibration_extruder_temp: {
    type: { kind: "number", above: 50 },
    description:
      "The extruder temperature (in C) set probe during drift calibration. When this option is supplied the procedure will wait for until the specified temperature is reached before requesting the first manual probe. When the calibration procedure is complete the extruder temperature will be set to 0. When omitted the default behavior is not to set the extruder temperature.",
    required: false,
  },
  extruder_heating_z: {
    type: { kind: "number", above: 0 },
    description:
      'The Z location where extruder heating will occur if the "calibration_extruder_temp" option is set. Its recommended to heat the extruder some distance from the bed to minimize its impact on the probe coil temperature. The default is 50.',
    required: false,
    default: 50,
  },
  max_validation_temp: {
    type: { kind: "number" },
    description:
      "The maximum temperature used to validate the calibration. It is recommended to set this to a value between 100 and 120 for enclosed printers. The default is 60.",
    required: false,
    default: 60,
  },
};

export const temperatureProbeSchema = createSchemaFromParams(temperature_probeParams);

export const temperatureProbeDefinition: SectionDefinition<typeof temperatureProbeSchema> = {
  id: "temperature_probe",
  naming: { kind: "named", prefix: "temperature_probe" },
  schema: temperatureProbeSchema,
  params: temperature_probeParams,
  order: 51,
  category: "Sensors",
  label: "Temperature Probe",
};

export const filament_switch_sensorParams: SectionParams = {
  pause_on_runout: {
    type: { kind: "boolean" },
    description:
      "When set to True, a PAUSE will execute immediately after a runout is detected. Note that if pause_on_runout is False and the runout_gcode is omitted then runout detection is disabled. Default is True.",
    required: false,
    default: true,
  },
  runout_gcode: {
    type: { kind: "string" },
    description:
      "A list of G-Code commands to execute after a filament runout is detected. See docs/Command_Templates.md for G-Code format. If pause_on_runout is set to True this G-Code will run after the PAUSE is complete. The default is not to run any G-Code commands.",
    required: false,
  },
  insert_gcode: {
    type: { kind: "string" },
    description:
      "A list of G-Code commands to execute after a filament insert is detected. See docs/Command_Templates.md for G-Code format. The default is not to run any G-Code commands, which disables insert detection.",
    required: false,
  },
  event_delay: {
    type: { kind: "number" },
    description:
      "The minimum amount of time in seconds to delay between events. Events triggered during this time period will be silently ignored. The default is 3 seconds.",
    required: false,
    default: 3,
  },
  pause_delay: {
    type: { kind: "number" },
    description:
      "The amount of time to delay, in seconds, between the pause command dispatch and execution of the runout_gcode. It may be useful to increase this delay if OctoPrint exhibits strange pause behavior. Default is 0.5 seconds.",
    required: false,
    default: 0.5,
  },
  debounce_delay: {
    type: { kind: "number", min: 0 },
    description:
      "A period of time in seconds to debounce events prior to running the switch gcode. The switch must he held in a single state for at least this long to activate. If the switch is toggled on/off during this delay, the event is ignored. Default is 0.",
    required: false,
    default: 0,
  },
  switch_pin: {
    type: { kind: "string" },
    description: "The pin on which the switch is connected. This parameter must be provided.",
    required: false,
  },
};

export const filament_motion_sensorParams: SectionParams = {
  detection_length: {
    type: { kind: "number", above: 0 },
    description:
      "The minimum length of filament pulled through the sensor to trigger a state change on the switch_pin Default is 7 mm.",
    required: true,
    default: 7,
  },
  extruder: {
    type: { kind: "string" },
    description:
      "The name of the extruder or extruder_stepper section this sensor is associated with. This parameter must be provided.",
    required: true,
  },
  switch_pin: {
    type: { kind: "string" },
    description: "switch_pin parameter",
    required: true,
  },
  pause_on_runout: {
    type: { kind: "boolean" },
    description: "pause_on_runout parameter",
    required: false,
    default: true,
  },
  runout_gcode: {
    type: { kind: "string" },
    description: "runout_gcode parameter",
    required: false,
  },
  insert_gcode: {
    type: { kind: "string" },
    description: "insert_gcode parameter",
    required: false,
  },
  event_delay: {
    type: { kind: "number" },
    description: "event_delay parameter",
    required: false,
    default: 3,
  },
};

export const tsl1401cl_filament_width_sensorParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "pin parameter",
    required: false,
  },
  default_nominal_filament_diameter: {
    type: { kind: "number", above: 1 },
    description: "Maximum allowed filament diameter difference as mm.",
    required: false,
  },
  max_difference: {
    type: { kind: "number", above: 0 },
    description: "The distance from sensor to the melting chamber as mm.",
    required: false,
    default: 0.2,
  },
  measurement_delay: {
    type: { kind: "number", above: 0 },
    description: "measurement_delay parameter",
    required: false,
    default: 100,
  },
};

export const tsl1401clFilamentWidthSensorSchema = createSchemaFromParams(tsl1401cl_filament_width_sensorParams);

export const tsl1401clFilamentWidthSensorDefinition: SectionDefinition<typeof tsl1401clFilamentWidthSensorSchema> = {
  id: "tsl1401cl_filament_width_sensor",
  naming: { kind: "fixed", header: "tsl1401cl_filament_width_sensor" },
  schema: tsl1401clFilamentWidthSensorSchema,
  params: tsl1401cl_filament_width_sensorParams,
  order: 70,
  category: "Sensors",
  label: "TSL1401CL Filament Width Sensor",
};

export const hall_filament_width_sensorParams: SectionParams = {
  adc1: {
    type: { kind: "string" },
    description: "adc1 parameter",
    required: true,
  },
  adc2: {
    type: { kind: "string" },
    description: "Analog input pins connected to the sensor. These parameters must be provided.",
    required: true,
  },
  cal_dia1: {
    type: { kind: "number" },
    description: "cal_dia1 parameter",
    required: false,
    default: 1.5,
  },
  cal_dia2: {
    type: { kind: "number" },
    description:
      "The calibration values (in mm) for the sensors. The default is 1.50 for cal_dia1 and 2.00 for cal_dia2.",
    required: false,
    default: 2,
  },
  raw_dia1: {
    type: { kind: "number", integer: true },
    description: "raw_dia1 parameter",
    required: false,
    default: 9500,
  },
  raw_dia2: {
    type: { kind: "number", integer: true },
    description: "The raw calibration values for the sensors. The default is 9500 for raw_dia1 and 10500 for raw_dia2.",
    required: false,
    default: 10500,
  },
  default_nominal_filament_diameter: {
    type: { kind: "number", above: 1 },
    description: "The nominal filament diameter. This parameter must be provided.",
    required: false,
    default: 1.75,
  },
  max_difference: {
    type: { kind: "number" },
    description:
      "Maximum allowed filament diameter difference in millimeters (mm). If difference between nominal filament diameter and sensor output is more than +- max_difference, extrusion multiplier is set back to %100. The default is 0.200.",
    required: false,
    default: 0.2,
  },
  measurement_delay: {
    type: { kind: "number", above: 0 },
    description:
      "The distance from sensor to the melting chamber/hot-end in millimeters (mm). The filament between the sensor and the hot-end will be treated as the default_nominal_filament_diameter. Host module works with FIFO logic. It keeps each sensor value and position in an array and POP them back in correct position. This parameter must be provided.",
    required: false,
    default: 70,
  },
  enable: {
    type: { kind: "boolean" },
    description: "Sensor enabled or disabled after power on. The default is to disable.",
    required: false,
    default: false,
  },
  measurement_interval: {
    type: { kind: "number", integer: true },
    description: "The approximate distance (in mm) between sensor readings. The default is 10mm.",
    required: false,
    default: 10,
  },
  logging: {
    type: { kind: "boolean" },
    description: "Out diameter to terminal and klipper.log can be turn on|of by command.",
    required: false,
    default: false,
  },
  min_diameter: {
    type: { kind: "number" },
    description: "Minimal diameter for trigger virtual filament_switch_sensor.",
    required: false,
    default: 1,
  },
  max_diameter: {
    type: { kind: "number" },
    description:
      "Maximum diameter for triggering virtual filament_switch_sensor. The default is default_nominal_filament_diameter + max_difference.",
    required: false,
  },
  use_current_dia_while_delay: {
    type: { kind: "boolean" },
    description:
      "Use the current diameter instead of the nominal diameter while the measurement delay has not run through.",
    required: false,
    default: false,
  },
  pause_on_runout: {
    type: { kind: "boolean" },
    description: "pause_on_runout parameter",
    required: false,
    default: true,
  },
  runout_gcode: {
    type: { kind: "string" },
    description: "runout_gcode parameter",
    required: false,
  },
  insert_gcode: {
    type: { kind: "string" },
    description: "insert_gcode parameter",
    required: false,
  },
  event_delay: {
    type: { kind: "number" },
    description: "event_delay parameter",
    required: false,
    default: 3,
  },
};

export const hallFilamentWidthSensorSchema = createSchemaFromParams(hall_filament_width_sensorParams);

export const hallFilamentWidthSensorDefinition: SectionDefinition<typeof hallFilamentWidthSensorSchema> = {
  id: "hall_filament_width_sensor",
  naming: { kind: "fixed", header: "hall_filament_width_sensor" },
  schema: hallFilamentWidthSensorSchema,
  params: hall_filament_width_sensorParams,
  order: 70,
  category: "Sensors",
  label: "Hall Filament Width Sensor",
};

export const load_cellParams: SectionParams = {
  sensor_type: {
    type: { kind: "choice", choices: ["the supported sensor types", "see below"] },
    description: "This must be one of the supported sensor types, see below.",
    required: true,
  },
  counts_per_gram: {
    type: { kind: "number" },
    description:
      "The floating point number of sensor counts that indicates 1 gram of force. This value is calculated by the LOAD_CELL_CALIBRATE command.",
    required: false,
  },
  reference_tare_counts: {
    type: { kind: "number", integer: true },
    description:
      "The integer tare value, in raw sensor counts, taken when LOAD_CELL_CALIBRATE is run. This is the default tare value when klipper starts up.",
    required: false,
  },
  sensor_orientation: {
    type: { kind: "string" },
    description:
      "Change the sensor's orientation. Can be either 'normal' or 'inverted'. The default is 'normal'. Use 'inverted' if the sensor reports a decreasing force value when placed under load.",
    required: false,
  },
};

export const loadCellSchema = createSchemaFromParams(load_cellParams);

export const loadCellDefinition: SectionDefinition<typeof loadCellSchema> = {
  id: "load_cell",
  naming: { kind: "fixed", header: "load_cell" },
  schema: loadCellSchema,
  params: load_cellParams,
  order: 70,
  category: "Sensors",
  label: "Load Cell",
};

export const load_cell_probeParams: SectionParams = {
  sensor_type: {
    type: { kind: "string" },
    description: "This must be one of the supported bulk ADC sensor types and support load cell endstops on the mcu.",
    required: true,
  },
  counts_per_gram: {
    type: { kind: "number" },
    description: "counts_per_gram parameter",
    required: false,
  },
  reference_tare_counts: {
    type: { kind: "number", integer: true },
    description: "reference_tare_counts parameter",
    required: false,
  },
  sensor_orientation: {
    type: { kind: "string" },
    description:
      "These parameters must be configured before the probe will operate. See the [load_cell] section for further details.",
    required: false,
  },
  force_safety_limit: {
    type: { kind: "number", integer: true },
    description:
      "The safe limit for probing force relative to the reference_tare_counts on the load_cell. The default is +/-2Kg.",
    required: false,
    default: 2000,
  },
  trigger_force: {
    type: { kind: "number" },
    description: "The force that the probe will trigger at. 75g is the default.",
    required: false,
    default: 75,
  },
  drift_filter_cutoff_frequency: {
    type: { kind: "number" },
    description:
      "Enable optional continuous taring while homing & probing to reject drift. The value is a frequency, in Hz, below which drift will be ignored. This option requires the SciPy library. Default: None",
    required: false,
    default: 0.8,
  },
  drift_filter_delay: {
    type: { kind: "number", integer: true },
    description:
      "The delay, or 'order', of the drift filter. This controls the number of samples required to make a trigger detection. Can be 1 or 2, the default is 2.",
    required: false,
    default: 2,
  },
  buzz_filter_cutoff_frequency: {
    type: { kind: "number" },
    description:
      "The value is a frequency, in Hz, above which high frequency noise in the load cell will be igfiltered outnored. This option requires the SciPy library. Default: None",
    required: false,
    default: 100,
  },
  buzz_filter_delay: {
    type: { kind: "number", integer: true },
    description:
      "The delay, or 'order', of the buzz filter. This controls the number of samples required to make a trigger detection. Can be 1 or 2, the default is 2.",
    required: false,
    default: 2,
  },
  notch_filter_frequencies: {
    type: { kind: "string" },
    description:
      "1 or 2 frequencies, in Hz, to filter out of the load cell data. This is intended to reject power line noise. This option requires the SciPy library. Default: None",
    required: false,
  },
  notch_filter_quality: {
    type: { kind: "number" },
    description:
      "Controls how narrow the range of frequencies are that the notch filter removes. Larger numbers produce a narrower filter. Minimum value is 0.5 and maximum is 3.0. Default: 2.0",
    required: false,
    default: 2,
  },
  tare_time: {
    type: { kind: "number" },
    description:
      "The rime in seconds used for taring the load_cell before each probe. The default value is: 4 / 60 = 0.066. This collects samples from 4 cycles of 60Hz mains power to cancel power line noise.",
    required: false,
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
  lift_speed: {
    type: { kind: "number", above: 0 },
    description: "lift_speed parameter",
    required: false,
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
    type: { kind: "string" },
    description: "activate_gcode parameter",
    required: false,
  },
  deactivate_gcode: {
    type: { kind: "string" },
    description: 'See the "[probe]" section for a description of the above parameters.',
    required: false,
  },
};

export const loadCellProbeSchema = createSchemaFromParams(load_cell_probeParams);

export const loadCellProbeDefinition: SectionDefinition<typeof loadCellProbeSchema> = {
  id: "load_cell_probe",
  naming: { kind: "fixed", header: "load_cell_probe" },
  schema: loadCellProbeSchema,
  params: load_cell_probeParams,
  order: 70,
  category: "Sensors",
  label: "Load Cell Probe",
};

export const ads1x1xParams: SectionParams = {
  chip: {
    type: { kind: "string" },
    description: "chip parameter",
    required: true,
  },
  pga: {
    type: { kind: "string" },
    description:
      "Default value is 4.096V. The maximum voltage range used for the input. This scales all values read from the ADC. Options are: 6.144V, 4.096V, 2.048V, 1.024V, 0.512V, 0.256V",
    required: false,
  },
  adc_voltage: {
    type: { kind: "number", above: 0 },
    description:
      "The supply voltage for the device. This allows additional software scaling for all values read from the ADC.",
    required: false,
    default: 3.3,
  },
  i2c_mcu: {
    type: { kind: "string" },
    description: "i2c_mcu parameter",
    required: true,
    default: "mcu",
  },
  i2c_bus: {
    type: { kind: "string" },
    description: "i2c_bus parameter",
    required: true,
  },
  address_pin: {
    type: { kind: "string" },
    description:
      "Default value is GND. There can be up to four addressed devices depending upon wiring of the device. Check the datasheet for details. The i2c_address can be specified directly instead of using the address_pin.",
    required: false,
  },
};

export const ads1x1xSchema = createSchemaFromParams(ads1x1xParams);

export const ads1x1xDefinition: SectionDefinition<typeof ads1x1xSchema> = {
  id: "ads1x1x",
  naming: { kind: "named", prefix: "ads1x1x" },
  schema: ads1x1xSchema,
  params: ads1x1xParams,
  order: 70,
  category: "Sensors",
  label: "ADS1x1x",
};

export const angleParams: SectionParams = {
  sensor_type: {
    type: { kind: "string" },
    description:
      'The type of the magnetic hall sensor chip. Available choices are "a1333", "as5047d", "mt6816", "mt6826s", and "tle5012b". This parameter must be specified.',
    required: true,
  },
  sample_period: {
    type: { kind: "number", above: 0 },
    description:
      "The query period (in seconds) to use during measurements. The default is 0.000400 (which is 2500 samples per second).",
    required: false,
    default: 0.0004,
  },
  stepper: {
    type: { kind: "string" },
    description:
      'The name of the stepper that the angle sensor is attached to (eg, "stepper_x"). Setting this value enables an angle calibration tool. To use this feature, the Python "numpy" package must be installed. The default is to not enable angle calibration for the angle sensor.',
    required: false,
  },
  cs_pin: {
    type: { kind: "string" },
    description: "The SPI enable pin for the sensor. This parameter must be provided.",
    required: true,
  },
  spi_speed: {
    type: { kind: "number", integer: true, min: 100000 },
    description: "spi_speed parameter",
    required: false,
  },
  spi_bus: {
    type: { kind: "string" },
    description: "spi_bus parameter",
    required: false,
  },
  spi_software_sclk_pin: {
    type: { kind: "string" },
    description: "spi_software_sclk_pin parameter",
    required: false,
  },
  spi_software_mosi_pin: {
    type: { kind: "string" },
    description: "spi_software_mosi_pin parameter",
    required: false,
  },
  spi_software_miso_pin: {
    type: { kind: "string" },
    description: 'See the "common SPI settings" section for a description of the above parameters.',
    required: false,
  },
};

export const angleSchema = createSchemaFromParams(angleParams);

export const angleDefinition: SectionDefinition<typeof angleSchema> = {
  id: "angle",
  naming: { kind: "named", prefix: "angle" },
  schema: angleSchema,
  params: angleParams,
  order: 70,
  category: "Sensors",
  label: "Angle",
};
