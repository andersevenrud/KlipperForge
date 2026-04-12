import { KNOWN_SENSOR_TYPES } from "../generated/heating";
import { temperature_sensorParams as generatedParams } from "../generated/sensors";
import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const temperature_sensorParams: SectionParams = {
  ...generatedParams,
  sensor_mcu: {
    type: { kind: "string" },
    description: "The micro-controller to read the sensor from. The default is mcu.",
    required: false,
  },
  sensor_type: {
    ...generatedParams.sensor_type,
    type: { kind: "choice", choices: KNOWN_SENSOR_TYPES },
    required: true,
  },
  sensor_pin: {
    ...generatedParams.sensor_pin,
    hiddenWhen: { field: "sensor_type", value: "temperature_combined" },
  },
  sensor_list: {
    type: { kind: "list", separator: ", " },
    description: 'Comma-separated list of temperature sensor names to combine (e.g. "extruder, heater_bed").',
    required: false,
    visibleWhen: { field: "sensor_type", value: "temperature_combined" },
  },
  combination_method: {
    type: { kind: "choice", choices: ["max", "min", "mean"] },
    description: "Method used to combine the sensor readings.",
    required: false,
    visibleWhen: { field: "sensor_type", value: "temperature_combined" },
  },
  maximum_deviation: {
    type: { kind: "number", above: 0 },
    description: "Maximum allowed deviation between combined sensor readings.",
    required: false,
    visibleWhen: { field: "sensor_type", value: "temperature_combined" },
  },
};

export const { schema: temperatureSensorSchema, definition: temperatureSensorDefinition } = defineSection(
  temperature_sensorParams,
  {
    id: "temperature_sensor",
    naming: { kind: "named", prefix: "temperature_sensor" },
    order: 51,
    category: "Sensors",
    label: "Temperature Sensor",
  },
);
