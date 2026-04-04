import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const save_variablesParams: SectionParams = {
  filename: {
    type: { kind: "string" },
    description: "Required - provide a filename that would be used to save the variables to disk e.g. ~/variables.cfg",
    required: true,
  },
};

export const saveVariablesSchema = createSchemaFromParams(save_variablesParams);

export const saveVariablesDefinition: SectionDefinition<typeof saveVariablesSchema> = {
  id: "save_variables",
  naming: { kind: "fixed", header: "save_variables" },
  schema: saveVariablesSchema,
  params: save_variablesParams,
  order: 70,
  category: "Misc",
  label: "Save Variables",
};

export const idle_timeoutParams: SectionParams = {
  gcode: {
    type: { kind: "multiline" },
    description:
      'A list of G-Code commands to execute on an idle timeout. See docs/Command_Templates.md for G-Code format. The default is to run "TURN_OFF_HEATERS" and "M84".',
    required: false,
  },
  timeout: {
    type: { kind: "number", above: 0 },
    description: "Idle time (in seconds) to wait before running the above G-Code commands. The default is 600 seconds.",
    required: false,
    default: 600,
  },
};

export const idleTimeoutSchema = createSchemaFromParams(idle_timeoutParams);

export const idleTimeoutDefinition: SectionDefinition<typeof idleTimeoutSchema> = {
  id: "idle_timeout",
  naming: { kind: "fixed", header: "idle_timeout" },
  schema: idleTimeoutSchema,
  params: idle_timeoutParams,
  order: 70,
  category: "Misc",
  label: "Idle Timeout",
};

export const virtual_sdcardParams: SectionParams = {
  path: {
    type: { kind: "string" },
    description:
      "The path of the local directory on the host machine to look for g-code files. This is a read-only directory (sdcard file writes are not supported). One may point this to OctoPrint's upload directory (generally ~/.octoprint/uploads/ ). This parameter must be provided.",
    required: true,
  },
  on_error_gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute when an error is reported. See docs/Command_Templates.md for G-Code format. The default is to run TURN_OFF_HEATERS.",
    required: false,
  },
};

export const virtualSdcardSchema = createSchemaFromParams(virtual_sdcardParams);

export const virtualSdcardDefinition: SectionDefinition<typeof virtualSdcardSchema> = {
  id: "virtual_sdcard",
  naming: { kind: "fixed", header: "virtual_sdcard" },
  schema: virtualSdcardSchema,
  params: virtual_sdcardParams,
  order: 70,
  category: "Misc",
  label: "Virtual SD Card",
};

export const force_moveParams: SectionParams = {
  enable_force_move: {
    type: { kind: "boolean" },
    description:
      "Set to true to enable FORCE_MOVE and SET_KINEMATIC_POSITION extended G-Code commands. The default is false.",
    required: false,
    default: false,
  },
};

export const forceMoveSchema = createSchemaFromParams(force_moveParams);

export const forceMoveDefinition: SectionDefinition<typeof forceMoveSchema> = {
  id: "force_move",
  naming: { kind: "fixed", header: "force_move" },
  schema: forceMoveSchema,
  params: force_moveParams,
  order: 70,
  category: "Misc",
  label: "Force Move",
};

export const pause_resumeParams: SectionParams = {
  recover_velocity: {
    type: { kind: "number" },
    description:
      "When capture/restore is enabled, the speed at which to return to the captured position (in mm/s). Default is 50.0 mm/s.",
    required: false,
    default: 50,
  },
};

export const pauseResumeSchema = createSchemaFromParams(pause_resumeParams);

export const pauseResumeDefinition: SectionDefinition<typeof pauseResumeSchema> = {
  id: "pause_resume",
  naming: { kind: "fixed", header: "pause_resume" },
  schema: pauseResumeSchema,
  params: pause_resumeParams,
  order: 70,
  category: "Misc",
  label: "Pause Resume",
};

export const firmware_retractionParams: SectionParams = {
  retract_length: {
    type: { kind: "number", min: 0 },
    description:
      "The length of filament (in mm) to retract when G10 is activated, and to unretract when G11 is activated (but see unretract_extra_length below). The default is 0 mm.",
    required: false,
    default: 0,
  },
  retract_speed: {
    type: { kind: "number", min: 1 },
    description: "The speed of retraction, in mm/s. The default is 20 mm/s.",
    required: false,
    default: 20,
  },
  unretract_extra_length: {
    type: { kind: "number", min: 0 },
    description: "The length (in mm) of *additional* filament to add when unretracting.",
    required: false,
    default: 0,
  },
  unretract_speed: {
    type: { kind: "number", min: 1 },
    description: "The speed of unretraction, in mm/s. The default is 10 mm/s.",
    required: false,
    default: 10,
  },
};

export const firmwareRetractionSchema = createSchemaFromParams(firmware_retractionParams);

export const firmwareRetractionDefinition: SectionDefinition<typeof firmwareRetractionSchema> = {
  id: "firmware_retraction",
  naming: { kind: "fixed", header: "firmware_retraction" },
  schema: firmwareRetractionSchema,
  params: firmware_retractionParams,
  order: 70,
  category: "Misc",
  label: "Firmware Retraction",
};

export const respondParams: SectionParams = {
  default_type: {
    type: { kind: "string" },
    description:
      'Sets the default prefix of the "M118" and "RESPOND" output to one of the following: echo: "echo: " (This is the default) command: "// " error: "!! "',
    required: false,
  },
  default_prefix: {
    type: { kind: "string" },
    description: 'Directly sets the default prefix. If present, this value will override the "default_type".',
    required: false,
  },
};

export const respondSchema = createSchemaFromParams(respondParams);

export const respondDefinition: SectionDefinition<typeof respondSchema> = {
  id: "respond",
  naming: { kind: "fixed", header: "respond" },
  schema: respondSchema,
  params: respondParams,
  order: 70,
  category: "Misc",
  label: "Respond",
};

export const exclude_objectParams: SectionParams = {};

export const excludeObjectSchema = createSchemaFromParams(exclude_objectParams);

export const excludeObjectDefinition: SectionDefinition<typeof excludeObjectSchema> = {
  id: "exclude_object",
  naming: { kind: "fixed", header: "exclude_object" },
  schema: excludeObjectSchema,
  params: exclude_objectParams,
  order: 70,
  category: "Misc",
  label: "Exclude Object",
};

export const sx1509Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description:
      "I2C address used by this expander. Depending on the hardware jumpers this is one out of the following addresses: 62 63 112 113. This parameter must be provided.",
    required: true,
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
    description: 'See the "common I2C settings" section for a description of the above parameters.',
    required: false,
  },
};

export const sx1509Schema = createSchemaFromParams(sx1509Params);

export const sx1509Definition: SectionDefinition<typeof sx1509Schema> = {
  id: "sx1509",
  naming: { kind: "named", prefix: "sx1509" },
  schema: sx1509Schema,
  params: sx1509Params,
  order: 70,
  category: "Misc",
  label: "SX1509",
};

export const display_statusParams: SectionParams = {};

export const displayStatusSchema = createSchemaFromParams(display_statusParams);

export const displayStatusDefinition: SectionDefinition<typeof displayStatusSchema> = {
  id: "display_status",
  naming: { kind: "fixed", header: "display_status" },
  schema: displayStatusSchema,
  params: display_statusParams,
  order: 70,
  category: "Misc",
  label: "Display Status",
};
