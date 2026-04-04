import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const KNOWN_SENSOR_TYPES = [
  // Thermistors
  "EPCOS 100K B57560G104F",
  "ATC Semitec 104GT-2",
  "ATC Semitec 104NT-4-R025H42G",
  "Generic 3950",
  "Honeywell 100K 135-104LAG-J01",
  "NTC 100K MGB18-104F39050L32",
  "SliceEngineering 450",
  "TDK NTCG104LH104JT1",
  // ADC temperature sensors
  "PT1000",
  "PT100 INA826",
  "AD595",
  "AD597",
  "AD8494",
  "AD8495",
  "AD8496",
  "AD8497",
  // SPI temperature sensors
  "MAX6675",
  "MAX31855",
  "MAX31856",
  "MAX31865",
  // I2C / digital sensors
  "BME280",
  "DS18B20",
  "SHT21",
  "SI7013",
  "SI7020",
  "SI7021",
  "HTU21D",
  "SHT3X",
  "AHT10",
  "LM75",
  // Built-in
  "temperature_host",
  "temperature_mcu",
  "temperature_combined",
];

export const extruderParams: SectionParams = {
  step_pin: {
    type: { kind: "string" },
    description: "step_pin parameter",
    required: true,
  },
  dir_pin: {
    type: { kind: "string" },
    description: "dir_pin parameter",
    required: true,
  },
  enable_pin: {
    type: { kind: "string" },
    description: "enable_pin parameter",
    required: true,
  },
  microsteps: {
    type: { kind: "number", integer: true, min: 1 },
    description: "microsteps parameter",
    required: true,
  },
  rotation_distance: {
    type: { kind: "number", above: 0 },
    description: "rotation_distance parameter",
    required: true,
  },
  full_steps_per_rotation: {
    type: { kind: "number", integer: true, min: 1 },
    description: "full_steps_per_rotation parameter",
    required: false,
    default: 200,
  },
  nozzle_diameter: {
    type: { kind: "number" },
    description: "Diameter of the nozzle orifice (in mm). This parameter must be provided.",
    required: true,
  },
  filament_diameter: {
    type: { kind: "number" },
    description:
      "The nominal diameter of the raw filament (in mm) as it enters the extruder. This parameter must be provided.",
    required: true,
  },
  max_extrude_cross_section: {
    type: { kind: "number" },
    description:
      "Maximum area (in mm^2) of an extrusion cross section (eg, extrusion width multiplied by layer height). This setting prevents excessive amounts of extrusion during relatively small XY moves. If a move requests an extrusion rate that would exceed this value it will cause an error to be returned. The default is: 4.0 * nozzle_diameter^2",
    required: false,
  },
  instantaneous_corner_velocity: {
    type: { kind: "number" },
    description:
      "The maximum instantaneous velocity change (in mm/s) of the extruder during the junction of two moves. The default is 1mm/s.",
    required: false,
    default: 1,
  },
  max_extrude_only_distance: {
    type: { kind: "number" },
    description:
      "Maximum length (in mm of raw filament) that a retraction or extrude-only move may have. If a retraction or extrude-only move requests a distance greater than this value it will cause an error to be returned. The default is 50mm.",
    required: false,
    default: 50,
  },
  max_extrude_only_velocity: {
    type: { kind: "number" },
    description: "max_extrude_only_velocity parameter",
    required: false,
  },
  max_extrude_only_accel: {
    type: { kind: "number" },
    description:
      "Maximum velocity (in mm/s) and acceleration (in mm/s^2) of the extruder motor for retractions and extrude-only moves. These settings do not have any impact on normal printing moves. If not specified then they are calculated to match the limit an XY printing move with a cross section of 4.0*nozzle_diameter^2 would have.",
    required: false,
  },
  pressure_advance: {
    type: { kind: "number" },
    description:
      "The amount of raw filament to push into the extruder during extruder acceleration. An equal amount of filament is retracted during deceleration. It is measured in millimeters per millimeter/second. The default is 0, which disables pressure advance.",
    required: false,
    default: 0,
  },
  pressure_advance_smooth_time: {
    type: { kind: "number" },
    description:
      "A time range (in seconds) to use when calculating the average extruder velocity for pressure advance. A larger value results in smoother extruder movements. This parameter may not exceed 200ms. This setting only applies if pressure_advance is non-zero. The default is 0.040 (40 milliseconds). The remaining variables describe the extruder heater.",
    required: false,
    default: 0.04,
  },
  heater_pin: {
    type: { kind: "string" },
    description: "PWM output pin controlling the heater. This parameter must be provided.",
    required: true,
  },
  max_power: {
    type: { kind: "number", max: 1, above: 0 },
    description:
      "The maximum power (expressed as a value from 0.0 to 1.0) that the heater_pin may be set to. The value 1.0 allows the pin to be set fully enabled for extended periods, while a value of 0.5 would allow the pin to be enabled for no more than half the time. This setting may be used to limit the total power output (over extended periods) to the heater. The default is 1.0.",
    required: false,
    default: 1,
  },
  sensor_type: {
    type: { kind: "choice", choices: KNOWN_SENSOR_TYPES },
    description:
      'Type of sensor - common thermistors are "EPCOS 100K B57560G104F", "ATC Semitec 104GT-2", "ATC Semitec 104NT-4-R025H42G", "Generic 3950","Honeywell 100K 135-104LAG-J01", "NTC 100K MGB18-104F39050L32", "SliceEngineering 450", and "TDK NTCG104LH104JT1". See the "Temperature sensors" section for other sensors. This parameter must be provided.',
    required: true,
  },
  sensor_pin: {
    type: { kind: "string" },
    description: "Analog input pin connected to the sensor. This parameter must be provided.",
    required: true,
  },
  pullup_resistor: {
    type: { kind: "number", above: 0 },
    description:
      "The resistance (in ohms) of the pullup attached to the thermistor. This parameter is only valid when the sensor is a thermistor. The default is 4700 ohms.",
    required: false,
    default: 4700,
  },
  smooth_time: {
    type: { kind: "number", above: 0 },
    description:
      "A time value (in seconds) over which temperature measurements will be smoothed to reduce the impact of measurement noise. The default is 1 seconds.",
    required: false,
    default: 1,
  },
  control: {
    type: { kind: "choice", choices: ["pid", "watermark"] },
    description: "Control algorithm (either pid or watermark). This parameter must be provided.",
    required: false,
  },
  pid_kp: {
    type: { kind: "number" },
    description: "pid_kp parameter",
    required: false,
  },
  pid_ki: {
    type: { kind: "number" },
    description: "pid_ki parameter",
    required: false,
  },
  pid_kd: {
    type: { kind: "number" },
    description:
      'The proportional (pid_Kp), integral (pid_Ki), and derivative (pid_Kd) settings for the PID feedback control system. Klipper evaluates the PID settings with the following general formula: heater_pwm = (Kp*error + Ki*integral(error) - Kd*derivative(error)) / 255 Where "error" is "requested_temperature - measured_temperature" and "heater_pwm" is the requested heating rate with 0.0 being full off and 1.0 being full on. Consider using the PID_CALIBRATE command to obtain these parameters. The pid_Kp, pid_Ki, and pid_Kd parameters must be provided for PID heaters.',
    required: false,
  },
  max_delta: {
    type: { kind: "number", above: 0 },
    description:
      "On 'watermark' controlled heaters this is the number of degrees in Celsius above the target temperature before disabling the heater as well as the number of degrees below the target before re-enabling the heater. The default is 2 degrees Celsius.",
    required: false,
    default: 2,
  },
  pwm_cycle_time: {
    type: { kind: "number", above: 0 },
    description:
      "Time in seconds for each software PWM cycle of the heater. It is not recommended to set this unless there is an electrical requirement to switch the heater faster than 10 times a second. The default is 0.100 seconds.",
    required: false,
    default: 0.1,
  },
  min_extrude_temp: {
    type: { kind: "number" },
    description:
      "The minimum temperature (in Celsius) at which extruder move commands may be issued. The default is 170 Celsius.",
    required: false,
    default: 170,
  },
  min_temp: {
    type: { kind: "number" },
    description: "min_temp parameter",
    required: true,
  },
  max_temp: {
    type: { kind: "number" },
    description:
      "The maximum range of valid temperatures (in Celsius) that the heater must remain within. This controls a safety feature implemented in the micro-controller code - should the measured temperature ever fall outside this range then the micro-controller will go into a shutdown state. This check can help detect some heater and sensor hardware failures. Set this range just wide enough so that reasonable temperatures do not result in an error. These parameters must be provided.",
    required: true,
  },
};

export const heater_bedParams: SectionParams = {
  heater_pin: {
    type: { kind: "string" },
    description: "PWM output pin controlling the heater. This parameter must be provided.",
    required: false,
  },
  sensor_type: {
    type: { kind: "choice", choices: KNOWN_SENSOR_TYPES },
    description:
      'Type of sensor - common thermistors are "EPCOS 100K B57560G104F", "ATC Semitec 104GT-2", "ATC Semitec 104NT-4-R025H42G", "Generic 3950","Honeywell 100K 135-104LAG-J01", "NTC 100K MGB18-104F39050L32", "SliceEngineering 450", and "TDK NTCG104LH104JT1". See the "Temperature sensors" section for other sensors. This parameter must be provided.',
    required: false,
  },
  sensor_pin: {
    type: { kind: "string" },
    description: "Analog input pin connected to the sensor. This parameter must be provided.",
    required: false,
  },
  control: {
    type: { kind: "choice", choices: ["pid", "watermark"] },
    description: "Control algorithm (either pid or watermark). This parameter must be provided.",
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
      "The maximum range of valid temperatures (in Celsius) that the heater must remain within. This controls a safety feature implemented in the micro-controller code - should the measured temperature ever fall outside this range then the micro-controller will go into a shutdown state. This check can help detect some heater and sensor hardware failures. Set this range just wide enough so that reasonable temperatures do not result in an error. These parameters must be provided.",
    required: false,
  },
  max_power: {
    type: { kind: "number", max: 1, above: 0 },
    description:
      "The maximum power (expressed as a value from 0.0 to 1.0) that the heater_pin may be set to. The value 1.0 allows the pin to be set fully enabled for extended periods, while a value of 0.5 would allow the pin to be enabled for no more than half the time. This setting may be used to limit the total power output (over extended periods) to the heater. The default is 1.0.",
    required: false,
    default: 1,
  },
  pullup_resistor: {
    type: { kind: "number", above: 0 },
    description:
      "The resistance (in ohms) of the pullup attached to the thermistor. This parameter is only valid when the sensor is a thermistor. The default is 4700 ohms.",
    required: false,
    default: 4700,
  },
  smooth_time: {
    type: { kind: "number", above: 0 },
    description:
      "A time value (in seconds) over which temperature measurements will be smoothed to reduce the impact of measurement noise. The default is 1 seconds.",
    required: false,
    default: 1,
  },
  pid_kp: {
    type: { kind: "number" },
    description: "pid_kp parameter",
    required: false,
  },
  pid_ki: {
    type: { kind: "number" },
    description: "pid_ki parameter",
    required: false,
  },
  pid_kd: {
    type: { kind: "number" },
    description:
      'The proportional (pid_Kp), integral (pid_Ki), and derivative (pid_Kd) settings for the PID feedback control system. Klipper evaluates the PID settings with the following general formula: heater_pwm = (Kp*error + Ki*integral(error) - Kd*derivative(error)) / 255 Where "error" is "requested_temperature - measured_temperature" and "heater_pwm" is the requested heating rate with 0.0 being full off and 1.0 being full on. Consider using the PID_CALIBRATE command to obtain these parameters. The pid_Kp, pid_Ki, and pid_Kd parameters must be provided for PID heaters.',
    required: false,
  },
  max_delta: {
    type: { kind: "number", above: 0 },
    description:
      "On 'watermark' controlled heaters this is the number of degrees in Celsius above the target temperature before disabling the heater as well as the number of degrees below the target before re-enabling the heater. The default is 2 degrees Celsius.",
    required: false,
    default: 2,
  },
  pwm_cycle_time: {
    type: { kind: "number", above: 0 },
    description:
      "Time in seconds for each software PWM cycle of the heater. It is not recommended to set this unless there is an electrical requirement to switch the heater faster than 10 times a second. The default is 0.100 seconds.",
    required: false,
    default: 0.1,
  },
};

export const verify_heaterParams: SectionParams = {
  max_error: {
    type: { kind: "number", min: 0 },
    description:
      'The maximum "cumulative temperature error" before raising an error. Smaller values result in stricter checking and larger values allow for more time before an error is reported. Specifically, the temperature is inspected once a second and if it is close to the target temperature then an internal "error counter" is reset; otherwise, if the temperature is below the target range then the counter is increased by the amount the reported temperature differs from that range. Should the counter exceed this "max_error" then an error is raised. The default is 120.',
    required: false,
    default: 120,
  },
  check_gain_time: {
    type: { kind: "number", min: 1 },
    description:
      'This controls heater verification during initial heating. Smaller values result in stricter checking and larger values allow for more time before an error is reported. Specifically, during initial heating, as long as the heater increases in temperature within this time frame (specified in seconds) then the internal "error counter" is reset. The default is 20 seconds for extruders and 60 seconds for heater_bed.',
    required: false,
    default: 20,
  },
  hysteresis: {
    type: { kind: "number", min: 0 },
    description:
      "The maximum temperature difference (in Celsius) to a target temperature that is considered in range of the target. This controls the max_error range check. It is rare to customize this value. The default is 5.",
    required: false,
    default: 5,
  },
  heating_gain: {
    type: { kind: "number", above: 0 },
    description:
      "The minimum temperature (in Celsius) that the heater must increase by during the check_gain_time check. It is rare to customize this value. The default is 2.",
    required: false,
    default: 2,
  },
};

export const verifyHeaterSchema = createSchemaFromParams(verify_heaterParams);

export const verifyHeaterDefinition: SectionDefinition<typeof verifyHeaterSchema> = {
  id: "verify_heater",
  naming: { kind: "named", prefix: "verify_heater" },
  schema: verifyHeaterSchema,
  params: verify_heaterParams,
  order: 32,
  category: "Heating",
  label: "Verify Heater",
};

export const homing_heatersParams: SectionParams = {
  steppers: {
    type: { kind: "string" },
    description:
      "A comma separated list of steppers that should cause heaters to be disabled. The default is to disable heaters for any homing/probing move. Typical example: stepper_z",
    required: false,
  },
  heaters: {
    type: { kind: "string" },
    description:
      "A comma separated list of heaters to disable during homing/probing moves. The default is to disable all heaters. Typical example: extruder, heater_bed",
    required: false,
  },
};

export const homingHeatersSchema = createSchemaFromParams(homing_heatersParams);

export const homingHeatersDefinition: SectionDefinition<typeof homingHeatersSchema> = {
  id: "homing_heaters",
  naming: { kind: "fixed", header: "homing_heaters" },
  schema: homingHeatersSchema,
  params: homing_heatersParams,
  order: 33,
  category: "Heating",
  label: "Homing Heaters",
};

export const thermistorParams: SectionParams = {
  temperature1: {
    type: { kind: "number" },
    description: "temperature1 parameter",
    required: false,
  },
  resistance1: {
    type: { kind: "number", min: 0 },
    description: "resistance1 parameter",
    required: false,
  },
  temperature2: {
    type: { kind: "number" },
    description: "temperature2 parameter",
    required: false,
  },
  resistance2: {
    type: { kind: "number", min: 0 },
    description: "resistance2 parameter",
    required: false,
  },
  temperature3: {
    type: { kind: "number" },
    description: "temperature3 parameter",
    required: false,
  },
  resistance3: {
    type: { kind: "number", min: 0 },
    description:
      "Three resistance measurements (in Ohms) at the given temperatures (in Celsius). The three measurements will be used to calculate the Steinhart-Hart coefficients for the thermistor. These parameters must be provided when using Steinhart-Hart to define the thermistor.",
    required: false,
  },
  beta: {
    type: { kind: "number", above: 0 },
    description:
      'Alternatively, one may define temperature1, resistance1, and beta to define the thermistor parameters. This parameter must be provided when using "beta" to define the thermistor.',
    required: false,
  },
};

export const thermistorSchema = createSchemaFromParams(thermistorParams);

export const thermistorDefinition: SectionDefinition<typeof thermistorSchema> = {
  id: "thermistor",
  naming: { kind: "named", prefix: "thermistor" },
  schema: thermistorSchema,
  params: thermistorParams,
  order: 34,
  category: "Heating",
  label: "Thermistor",
};

export const adc_temperatureParams: SectionParams = {
  temperature1: {
    type: { kind: "number" },
    description: "temperature1 parameter",
    required: false,
  },
  voltage1: {
    type: { kind: "string" },
    description: "voltage1 parameter",
    required: false,
  },
  temperature2: {
    type: { kind: "number" },
    description: "temperature2 parameter",
    required: false,
  },
  voltage2: {
    type: { kind: "number" },
    description:
      '... A set of temperatures (in Celsius) and voltages (in Volts) to use as reference when converting a temperature. A heater section using this sensor may also specify adc_voltage and voltage_offset parameters to define the ADC voltage (see "Common temperature amplifiers" section for details). At least two measurements must be provided.',
    required: false,
  },
  resistance1: {
    type: { kind: "string" },
    description: "resistance1 parameter",
    required: false,
  },
  resistance2: {
    type: { kind: "number", min: 0 },
    description:
      '... Alternatively one may specify a set of temperatures (in Celsius) and resistance (in Ohms) to use as reference when converting a temperature. A heater section using this sensor may also specify a pullup_resistor parameter (see "extruder" section for details). At least two measurements must be provided.',
    required: false,
  },
};

export const adcTemperatureSchema = createSchemaFromParams(adc_temperatureParams);

export const adcTemperatureDefinition: SectionDefinition<typeof adcTemperatureSchema> = {
  id: "adc_temperature",
  naming: { kind: "named", prefix: "adc_temperature" },
  schema: adcTemperatureSchema,
  params: adc_temperatureParams,
  order: 34,
  category: "Heating",
  label: "ADC Temperature",
};

export const heater_genericParams: SectionParams = {
  gcode_id: {
    type: { kind: "string" },
    description: "The id to use when reporting the temperature in the M105 command. This parameter must be provided.",
    required: false,
  },
  heater_pin: {
    type: { kind: "string" },
    description: "heater_pin parameter",
    required: false,
  },
  max_power: {
    type: { kind: "number", max: 1, above: 0 },
    description: "max_power parameter",
    required: false,
    default: 1,
  },
  sensor_type: {
    type: { kind: "choice", choices: KNOWN_SENSOR_TYPES },
    description: "sensor_type parameter",
    required: false,
  },
  sensor_pin: {
    type: { kind: "string" },
    description: "sensor_pin parameter",
    required: false,
  },
  smooth_time: {
    type: { kind: "number", above: 0 },
    description: "smooth_time parameter",
    required: false,
    default: 1,
  },
  control: {
    type: { kind: "string" },
    description: "control parameter",
    required: false,
  },
  pid_kp: {
    type: { kind: "number" },
    description: "pid_kp parameter",
    required: false,
  },
  pid_ki: {
    type: { kind: "number" },
    description: "pid_ki parameter",
    required: false,
  },
  pid_kd: {
    type: { kind: "number" },
    description: "pid_kd parameter",
    required: false,
  },
  pwm_cycle_time: {
    type: { kind: "number", above: 0 },
    description: "pwm_cycle_time parameter",
    required: false,
    default: 0.1,
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
  },
};

export const heaterGenericSchema = createSchemaFromParams(heater_genericParams);

export const heaterGenericDefinition: SectionDefinition<typeof heaterGenericSchema> = {
  id: "heater_generic",
  naming: { kind: "named", prefix: "heater_generic" },
  schema: heaterGenericSchema,
  params: heater_genericParams,
  order: 31,
  category: "Heating",
  label: "Generic Heater",
};
