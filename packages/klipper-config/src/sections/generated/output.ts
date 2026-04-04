import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

export const ledParams: SectionParams = {
  red_pin: {
    type: { kind: "string" },
    description: "red_pin parameter",
    required: false,
  },
  green_pin: {
    type: { kind: "string" },
    description: "green_pin parameter",
    required: false,
  },
  blue_pin: {
    type: { kind: "string" },
    description: "blue_pin parameter",
    required: false,
  },
  white_pin: {
    type: { kind: "string" },
    description: "The pin controlling the given LED color. At least one of the above parameters must be provided.",
    required: false,
  },
  cycle_time: {
    type: { kind: "number", above: 0 },
    description:
      "The amount of time (in seconds) per PWM cycle. It is recommended this be 10 milliseconds or greater when using software based PWM. The default is 0.010 seconds.",
    required: false,
    default: 0.01,
  },
  hardware_pwm: {
    type: { kind: "boolean" },
    description:
      "Enable this to use hardware PWM instead of software PWM. When using hardware PWM the actual cycle time is constrained by the implementation and may be significantly different than the requested cycle_time. The default is False.",
    required: false,
    default: false,
  },
  initial_red: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_red parameter",
    required: false,
    default: 0,
  },
  initial_green: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_green parameter",
    required: false,
    default: 0,
  },
  initial_blue: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_blue parameter",
    required: false,
    default: 0,
  },
  initial_white: {
    type: { kind: "number", min: 0, max: 1 },
    description:
      "Sets the initial LED color. Each value should be between 0.0 and 1.0. The default for each color is 0.",
    required: false,
    default: 0,
  },
};

export const ledSchema = createSchemaFromParams(ledParams);

export const ledDefinition: SectionDefinition<typeof ledSchema> = {
  id: "led",
  naming: { kind: "named", prefix: "led" },
  schema: ledSchema,
  params: ledParams,
  order: 56,
  category: "Output",
  label: "LED",
};

export const neopixelParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "The pin connected to the neopixel. This parameter must be provided.",
    required: true,
  },
  chain_count: {
    type: { kind: "number", integer: true, min: 1 },
    description:
      'The number of Neopixel chips that are "daisy chained" to the provided pin. The default is 1 (which indicates only a single Neopixel is connected to the pin).',
    required: false,
    default: 1,
  },
  color_order: {
    type: { kind: "string" },
    description:
      "Set the pixel order required by the LED hardware (using a string containing the letters R, G, B, W with W optional). Alternatively, this may be a comma separated list of pixel orders - one for each LED in the chain. The default is GRB.",
    required: false,
    default: "RGBW",
  },
  initial_red: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_red parameter",
    required: false,
    default: 0,
  },
  initial_green: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_green parameter",
    required: false,
    default: 0,
  },
  initial_blue: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_blue parameter",
    required: false,
    default: 0,
  },
  initial_white: {
    type: { kind: "number", min: 0, max: 1 },
    description: 'See the "led" section for information on these parameters.',
    required: false,
    default: 0,
  },
};

export const neopixelSchema = createSchemaFromParams(neopixelParams);

export const neopixelDefinition: SectionDefinition<typeof neopixelSchema> = {
  id: "neopixel",
  naming: { kind: "named", prefix: "neopixel" },
  schema: neopixelSchema,
  params: neopixelParams,
  order: 56,
  category: "Output",
  label: "NeoPixel",
};

export const dotstarParams: SectionParams = {
  data_pin: {
    type: { kind: "string" },
    description: "The pin connected to the data line of the dotstar. This parameter must be provided.",
    required: true,
  },
  clock_pin: {
    type: { kind: "string" },
    description: "The pin connected to the clock line of the dotstar. This parameter must be provided.",
    required: true,
  },
  chain_count: {
    type: { kind: "number", integer: true, min: 1 },
    description: 'See the "neopixel" section for information on this parameter.',
    required: false,
    default: 1,
  },
  initial_red: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_red parameter",
    required: false,
    default: 0,
  },
  initial_green: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_green parameter",
    required: false,
    default: 0,
  },
  initial_blue: {
    type: { kind: "number", min: 0, max: 1 },
    description: 'See the "led" section for information on these parameters.',
    required: false,
    default: 0,
  },
};

export const dotstarSchema = createSchemaFromParams(dotstarParams);

export const dotstarDefinition: SectionDefinition<typeof dotstarSchema> = {
  id: "dotstar",
  naming: { kind: "named", prefix: "dotstar" },
  schema: dotstarSchema,
  params: dotstarParams,
  order: 56,
  category: "Output",
  label: "Dotstar",
};

export const pca9533Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description:
      "The i2c address that the chip is using on the i2c bus. Use 98 for the PCA9533/1, 99 for the PCA9533/2. The default is 98.",
    required: false,
    default: 98,
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
  initial_red: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_red parameter",
    required: false,
    default: 0,
  },
  initial_green: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_green parameter",
    required: false,
    default: 0,
  },
  initial_blue: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_blue parameter",
    required: false,
    default: 0,
  },
  initial_white: {
    type: { kind: "number", min: 0, max: 1 },
    description: 'See the "led" section for information on these parameters.',
    required: false,
    default: 0,
  },
};

export const pca9533Schema = createSchemaFromParams(pca9533Params);

export const pca9533Definition: SectionDefinition<typeof pca9533Schema> = {
  id: "pca9533",
  naming: { kind: "named", prefix: "pca9533" },
  schema: pca9533Schema,
  params: pca9533Params,
  order: 56,
  category: "Output",
  label: "PCA9533",
};

export const pca9632Params: SectionParams = {
  i2c_address: {
    type: { kind: "number", integer: true, min: 0, max: 127 },
    description:
      "The i2c address that the chip is using on the i2c bus. This may be 96, 97, 98, or 99. The default is 98.",
    required: false,
    default: 98,
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
  color_order: {
    type: { kind: "string" },
    description:
      "Set the pixel order of the LED (using a string containing the letters R, G, B, W). The default is RGBW.",
    required: false,
    default: "RGBW",
  },
  initial_red: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_red parameter",
    required: false,
    default: 0,
  },
  initial_green: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_green parameter",
    required: false,
    default: 0,
  },
  initial_blue: {
    type: { kind: "number", min: 0, max: 1 },
    description: "initial_blue parameter",
    required: false,
    default: 0,
  },
  initial_white: {
    type: { kind: "number", min: 0, max: 1 },
    description: 'See the "led" section for information on these parameters.',
    required: false,
    default: 0,
  },
};

export const pca9632Schema = createSchemaFromParams(pca9632Params);

export const pca9632Definition: SectionDefinition<typeof pca9632Schema> = {
  id: "pca9632",
  naming: { kind: "named", prefix: "pca9632" },
  schema: pca9632Schema,
  params: pca9632Params,
  order: 56,
  category: "Output",
  label: "PCA9632",
};

export const servoParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "PWM output pin controlling the servo. This parameter must be provided.",
    required: true,
  },
  maximum_servo_angle: {
    type: { kind: "number" },
    description: "The maximum angle (in degrees) that this servo can be set to. The default is 180 degrees.",
    required: false,
    default: 180,
  },
  minimum_pulse_width: {
    type: { kind: "number", above: 0 },
    description:
      "The minimum pulse width time (in seconds). This should correspond with an angle of 0 degrees. The default is 0.001 seconds.",
    required: false,
    default: 0.001,
  },
  maximum_pulse_width: {
    type: { kind: "number" },
    description:
      "The maximum pulse width time (in seconds). This should correspond with an angle of maximum_servo_angle. The default is 0.002 seconds.",
    required: false,
    default: 0.002,
  },
  initial_angle: {
    type: { kind: "number", min: 0, max: 360 },
    description: "Initial angle (in degrees) to set the servo to. The default is to not send any signal at startup.",
    required: false,
  },
  initial_pulse_width: {
    type: { kind: "number", min: 0 },
    description:
      "Initial pulse width time (in seconds) to set the servo to. (This is only valid if initial_angle is not set.) The default is to not send any signal at startup.",
    required: false,
    default: 0,
  },
};

export const servoSchema = createSchemaFromParams(servoParams);

export const servoDefinition: SectionDefinition<typeof servoSchema> = {
  id: "servo",
  naming: { kind: "named", prefix: "servo" },
  schema: servoSchema,
  params: servoParams,
  order: 55,
  category: "Output",
  label: "Servo",
};

export const output_pinParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "The pin to configure as an output. This parameter must be provided.",
    required: true,
  },
  pwm: {
    type: { kind: "boolean" },
    description:
      "Set if the output pin should be capable of pulse-width-modulation. If this is true, the value fields should be between 0 and 1; if it is false the value fields should be either 0 or 1. The default is False.",
    required: false,
    default: false,
  },
  value: {
    type: { kind: "number", min: 0 },
    description: "The value to initially set the pin to during MCU configuration. The default is 0 (for low voltage).",
    required: false,
    default: 0,
  },
  shutdown_value: {
    type: { kind: "number", min: 0 },
    description: "The value to set the pin to on an MCU shutdown event. The default is 0 (for low voltage).",
    required: false,
    default: 0,
  },
  cycle_time: {
    type: { kind: "number", above: 0 },
    description:
      "The amount of time (in seconds) per PWM cycle. It is recommended this be 10 milliseconds or greater when using software based PWM. The default is 0.100 seconds for pwm pins.",
    required: false,
    default: 0.1,
  },
  hardware_pwm: {
    type: { kind: "boolean" },
    description:
      "Enable this to use hardware PWM instead of software PWM. When using hardware PWM the actual cycle time is constrained by the implementation and may be significantly different than the requested cycle_time. The default is False.",
    required: false,
    default: false,
  },
  scale: {
    type: { kind: "number", above: 0 },
    description:
      "This parameter can be used to alter how the 'value' and 'shutdown_value' parameters are interpreted for pwm pins. If provided, then the 'value' parameter should be between 0.0 and 'scale'. This may be useful when configuring a PWM pin that controls a stepper voltage reference. The 'scale' can be set to the equivalent stepper amperage if the PWM were fully enabled, and then the 'value' parameter can be specified using the desired amperage for the stepper. The default is to not scale the 'value' parameter.",
    required: false,
    default: 1,
  },
};

export const outputPinSchema = createSchemaFromParams(output_pinParams);

export const outputPinDefinition: SectionDefinition<typeof outputPinSchema> = {
  id: "output_pin",
  naming: { kind: "named", prefix: "output_pin" },
  schema: outputPinSchema,
  params: output_pinParams,
  order: 55,
  category: "Output",
  label: "Output Pin",
};

export const pwm_toolParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "The pin to configure as an output. This parameter must be provided.",
    required: true,
  },
  maximum_mcu_duration: {
    type: { kind: "number", min: 0.5 },
    description:
      "The maximum duration a non-shutdown value may be driven by the MCU without an acknowledge from the host. If host can not keep up with an update, the MCU will shutdown and set all pins to their respective shutdown values. Default: 0 (disabled) Usual values are around 5 seconds.",
    required: false,
    default: 0,
  },
  value: {
    type: { kind: "number", min: 0 },
    description: "value parameter",
    required: false,
    default: 0,
  },
  shutdown_value: {
    type: { kind: "number", min: 0 },
    description: "shutdown_value parameter",
    required: false,
    default: 0,
  },
  cycle_time: {
    type: { kind: "number", above: 0 },
    description: "cycle_time parameter",
    required: false,
    default: 0.1,
  },
  hardware_pwm: {
    type: { kind: "boolean" },
    description: "hardware_pwm parameter",
    required: false,
    default: false,
  },
  scale: {
    type: { kind: "number", above: 0 },
    description: 'See the "output_pin" section for the definition of these parameters.',
    required: false,
    default: 1,
  },
};

export const pwmToolSchema = createSchemaFromParams(pwm_toolParams);

export const pwmToolDefinition: SectionDefinition<typeof pwmToolSchema> = {
  id: "pwm_tool",
  naming: { kind: "named", prefix: "pwm_tool" },
  schema: pwmToolSchema,
  params: pwm_toolParams,
  order: 55,
  category: "Output",
  label: "PWM Tool",
};

export const pwm_cycle_timeParams: SectionParams = {
  pin: {
    type: { kind: "string" },
    description: "pin parameter",
    required: true,
  },
  value: {
    type: { kind: "number", min: 0 },
    description: "value parameter",
    required: false,
    default: 0,
  },
  shutdown_value: {
    type: { kind: "number", min: 0 },
    description: "shutdown_value parameter",
    required: false,
    default: 0,
  },
  cycle_time: {
    type: { kind: "number", above: 0 },
    description: "cycle_time parameter",
    required: false,
    default: 0.1,
  },
  scale: {
    type: { kind: "number", above: 0 },
    description: 'See the "output_pin" section for information on these parameters.',
    required: false,
    default: 1,
  },
};

export const pwmCycleTimeSchema = createSchemaFromParams(pwm_cycle_timeParams);

export const pwmCycleTimeDefinition: SectionDefinition<typeof pwmCycleTimeSchema> = {
  id: "pwm_cycle_time",
  naming: { kind: "named", prefix: "pwm_cycle_time" },
  schema: pwmCycleTimeSchema,
  params: pwm_cycle_timeParams,
  order: 55,
  category: "Output",
  label: "PWM Cycle Time",
};

export const multi_pinParams: SectionParams = {
  pins: {
    type: { kind: "string" },
    description: "A comma separated list of pins associated with this alias. This parameter must be provided.",
    required: true,
  },
};

export const multiPinSchema = createSchemaFromParams(multi_pinParams);

export const multiPinDefinition: SectionDefinition<typeof multiPinSchema> = {
  id: "multi_pin",
  naming: { kind: "named", prefix: "multi_pin" },
  schema: multiPinSchema,
  params: multi_pinParams,
  order: 56,
  category: "Output",
  label: "Multi Pin",
};
