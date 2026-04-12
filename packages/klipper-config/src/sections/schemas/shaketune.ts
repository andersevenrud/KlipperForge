import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

const shaketuneParams: SectionParams = {
  result_folder: {
    type: { kind: "string" },
    description: "Path to store results.",
    required: false,
    default: "~/printer_data/config/ShakeTune_results",
  },
  number_of_results_to_keep: {
    type: { kind: "number", integer: true, min: 1 },
    description: "Number of result sets to keep.",
    required: false,
    default: 10,
  },
  keep_raw_data: {
    type: { kind: "boolean" },
    description: "Keep raw accelerometer data files.",
    required: false,
    default: false,
  },
  show_macros_in_webui: {
    type: { kind: "boolean" },
    description: "Show Shake&Tune macros in the web UI.",
    required: false,
    default: true,
  },
  timeout: {
    type: { kind: "number", integer: true, min: 1 },
    description: "Timeout in seconds for measurements.",
    required: false,
    default: 600,
  },
  measurements_chunk_size: {
    type: { kind: "number", integer: true, min: 1 },
    description: "Number of measurements per chunk.",
    required: false,
    default: 2,
  },
  max_freq: {
    type: { kind: "number", min: 1 },
    description: "Maximum frequency for analysis in Hz.",
    required: false,
    default: 200,
  },
  dpi: {
    type: { kind: "number", integer: true, min: 50 },
    description: "DPI for generated graphs.",
    required: false,
    default: 300,
  },
};

export const { definition: shaketuneDefinition } = defineSection(shaketuneParams, {
  id: "shaketune",
  naming: { kind: "fixed", header: "shaketune" },
  order: 81,
  category: "Plugins",
  label: "Shake&Tune",
});
