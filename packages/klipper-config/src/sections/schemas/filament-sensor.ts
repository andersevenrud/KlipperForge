import { filament_motion_sensorParams, filament_switch_sensorParams } from "../generated/sensors";
import { defineSection } from "../schema-from-params";

export const { schema: filamentSensorSchema, definition: filamentSwitchSensorDefinition } = defineSection(
  filament_switch_sensorParams,
  {
    id: "filament_switch_sensor",
    naming: { kind: "named", prefix: "filament_switch_sensor" },
    order: 50,
    category: "Sensors",
    label: "Filament Switch Sensor",
  },
);

export const { definition: filamentMotionSensorDefinition } = defineSection(filament_motion_sensorParams, {
  id: "filament_motion_sensor",
  naming: { kind: "named", prefix: "filament_motion_sensor" },
  order: 50,
  category: "Sensors",
  label: "Filament Motion Sensor",
});
