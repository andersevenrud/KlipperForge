import { filament_motion_sensorParams, filament_switch_sensorParams } from "../generated/sensors";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const filamentSensorSchema = createSchemaFromParams(filament_switch_sensorParams);
const filamentMotionSchema = createSchemaFromParams(filament_motion_sensorParams);

export const filamentSwitchSensorDefinition: SectionDefinition<typeof filamentSensorSchema> = {
  id: "filament_switch_sensor",
  naming: { kind: "named", prefix: "filament_switch_sensor" },
  schema: filamentSensorSchema,
  params: filament_switch_sensorParams,
  order: 50,
  category: "Sensors",
  label: "Filament Switch Sensor",
};

export const filamentMotionSensorDefinition: SectionDefinition<typeof filamentMotionSchema> = {
  id: "filament_motion_sensor",
  naming: { kind: "named", prefix: "filament_motion_sensor" },
  schema: filamentMotionSchema,
  params: filament_motion_sensorParams,
  order: 50,
  category: "Sensors",
  label: "Filament Motion Sensor",
};
