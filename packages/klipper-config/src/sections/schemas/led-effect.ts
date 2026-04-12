import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const ledEffectParams: SectionParams = {
  autostart: {
    type: { kind: "boolean" },
    description: "Start the effect automatically on printer startup.",
    required: false,
    default: false,
  },
  frame_rate: {
    type: { kind: "number" },
    description: "Animation frame rate in frames per second.",
    required: false,
  },
  run_on_error: {
    type: { kind: "boolean" },
    description: "Continue running the effect when the printer is in an error state.",
    required: false,
    default: false,
  },
  recalculate: {
    type: { kind: "boolean" },
    description: "Recalculate the effect on each frame.",
    required: false,
    default: false,
  },
  heater: {
    type: { kind: "string" },
    description: "Heater name for temperature-based effects (e.g. 'extruder').",
    required: false,
  },
  analog_pin: {
    type: { kind: "string" },
    description: "Analog pin for analog-based effects.",
    required: false,
  },
  stepper: {
    type: { kind: "choice", choices: ["x", "y", "z"] },
    description: "Stepper axis for stepper-based effects.",
    required: false,
  },
  endstops: {
    type: { kind: "string" },
    description: "Comma-separated list of endstop names.",
    required: false,
  },
  button_pins: {
    type: { kind: "string" },
    description: "Comma-separated list of button pin names.",
    required: false,
  },
  leds: {
    type: { kind: "multiline" },
    description: "LED strip references, one per line (e.g. 'neopixel:name (1-10)').",
    required: true,
  },
  layers: {
    type: { kind: "multiline" },
    description: "Effect layer definitions, one per line.",
    required: true,
  },
};

export const { definition: ledEffectDefinition } = defineSection(ledEffectParams, {
  id: "led_effect",
  naming: { kind: "named", prefix: "led_effect" },
  order: 80,
  category: "Plugins",
  label: "LED Effect",
});
