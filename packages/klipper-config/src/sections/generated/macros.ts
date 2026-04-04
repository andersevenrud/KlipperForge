import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const gcode_macroParams: SectionParams = {
  gcode: {
    type: { kind: "multiline" },
    description:
      'A list of G-Code commands to execute in place of "my_cmd". See docs/Command_Templates.md for G-Code format. This parameter must be provided. variable_<name>: One may specify any number of options with a "variable_" prefix. The given variable name will be assigned the given value (parsed as a Python literal) and will be available during macro expansion. For example, a config with "variable_fan_speed = 75" might have gcode commands containing "M106 S{ fan_speed * 255 }". Variables can be changed at run-time using the SET_GCODE_VARIABLE command (see docs/Command_Templates.md for details). Variable names may not use upper case characters.',
    required: false,
  },
  rename_existing: {
    type: { kind: "string" },
    description:
      "This option will cause the macro to override an existing G-Code command and provide the previous definition of the command via the name provided here. This can be used to override builtin G-Code commands. Care should be taken when overriding commands as it can cause complex and unexpected results. The default is to not override an existing G-Code command.",
    required: false,
  },
  description: {
    type: { kind: "string" },
    description:
      'This will add a short description used at the HELP command or while using the auto completion feature. Default "G-Code macro"',
    required: false,
    default: "G-Code macro",
  },
};

export const gcodeMacroSchema = createSchemaFromParams(gcode_macroParams);

export const gcodeMacroDefinition: SectionDefinition<typeof gcodeMacroSchema> = {
  id: "gcode_macro",
  naming: { kind: "fixed", header: "gcode_macro" },
  schema: gcodeMacroSchema,
  params: gcode_macroParams,
  order: 60,
  category: "Macros",
  label: "G-Code Macro",
};

export const delayed_gcodeParams: SectionParams = {
  gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute when the delay duration has elapsed. G-Code templates are supported. This parameter must be provided.",
    required: true,
  },
  initial_duration: {
    type: { kind: "number", min: 0 },
    description:
      'The duration of the initial delay (in seconds). If set to a non-zero value the delayed_gcode will execute the specified number of seconds after the printer enters the "ready" state. This can be useful for initialization procedures or a repeating delayed_gcode. If set to 0 the delayed_gcode will not execute on startup. Default is 0.',
    required: false,
    default: 0,
  },
};

export const delayedGcodeSchema = createSchemaFromParams(delayed_gcodeParams);

export const delayedGcodeDefinition: SectionDefinition<typeof delayedGcodeSchema> = {
  id: "delayed_gcode",
  naming: { kind: "fixed", header: "delayed_gcode" },
  schema: delayedGcodeSchema,
  params: delayed_gcodeParams,
  order: 60,
  category: "Macros",
  label: "Delayed G-Code",
};

export const gcode_arcsParams: SectionParams = {
  resolution: {
    type: { kind: "number", above: 0 },
    description:
      "An arc will be split into segments. Each segment's length will equal the resolution in mm set above. Lower values will produce a finer arc, but also more work for your machine. Arcs smaller than the configured value will become straight lines. The default is 1mm.",
    required: false,
    default: 1,
  },
};

export const gcodeArcsSchema = createSchemaFromParams(gcode_arcsParams);

export const gcodeArcsDefinition: SectionDefinition<typeof gcodeArcsSchema> = {
  id: "gcode_arcs",
  naming: { kind: "fixed", header: "gcode_arcs" },
  schema: gcodeArcsSchema,
  params: gcode_arcsParams,
  order: 60,
  category: "Macros",
  label: "G-Code Arcs",
};

export const gcode_buttonParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "The pin on which the button is connected. This parameter must be provided.",
    required: true,
  },
  analog_range: {
    type: { kind: "string" },
    description:
      "Two comma separated resistances (in Ohms) specifying the minimum and maximum resistance range for the button. If analog_range is provided then the pin must be an analog capable pin. The default is to use digital gpio for the button.",
    required: false,
  },
  analog_pullup_resistor: {
    type: { kind: "number", above: 0 },
    description: "The pullup resistance (in Ohms) when analog_range is specified. The default is 4700 ohms.",
    required: false,
    default: 4700,
  },
  press_gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute when the button is pressed. G-Code templates are supported. This parameter must be provided.",
    required: false,
  },
  release_gcode: {
    type: { kind: "multiline" },
    description:
      "A list of G-Code commands to execute when the button is released. G-Code templates are supported. The default is to not run any commands on a button release.",
    required: false,
  },
  debounce_delay: {
    type: { kind: "number", min: 0 },
    description:
      "A period of time in seconds to debounce events prior to running the button gcode. If the button is pressed and released during this delay, the entire button press is ignored. Default is 0.",
    required: false,
    default: 0,
  },
};

export const gcodeButtonSchema = createSchemaFromParams(gcode_buttonParams);

export const gcodeButtonDefinition: SectionDefinition<typeof gcodeButtonSchema> = {
  id: "gcode_button",
  naming: { kind: "named", prefix: "gcode_button" },
  schema: gcodeButtonSchema,
  params: gcode_buttonParams,
  order: 60,
  category: "Macros",
  label: "G-Code Button",
};
