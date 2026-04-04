import type { PcbConnectorCategory } from "./types";

export const CATEGORIES: PcbConnectorCategory[] = [
  "stepper",
  "fan",
  "heater",
  "thermistor",
  "endstop",
  "display",
  "probe",
  "power",
  "communication",
  "driver",
  "jumper",
  "button",
  "dip-switch",
  "misc",
];

export const CATEGORY_COLORS: Record<PcbConnectorCategory, { fill: string; stroke: string }> = {
  stepper: { fill: "rgba(107,33,168,0.4)", stroke: "#a855f7" },
  driver: { fill: "rgba(91,33,182,0.35)", stroke: "#8b5cf6" },
  heater: { fill: "rgba(153,27,27,0.4)", stroke: "#ef4444" },
  fan: { fill: "rgba(30,64,175,0.4)", stroke: "#3b82f6" },
  endstop: { fill: "rgba(22,101,52,0.4)", stroke: "#22c55e" },
  thermistor: { fill: "rgba(133,77,14,0.4)", stroke: "#eab308" },
  display: { fill: "rgba(74,85,104,0.4)", stroke: "#94a3b8" },
  probe: { fill: "rgba(14,116,144,0.4)", stroke: "#06b6d4" },
  power: { fill: "rgba(154,52,18,0.4)", stroke: "#f97316" },
  communication: { fill: "rgba(14,116,144,0.35)", stroke: "#94a3b8" },
  jumper: { fill: "rgba(109,40,217,0.35)", stroke: "#a78bfa" },
  button: { fill: "rgba(185,28,28,0.4)", stroke: "#f87171" },
  "dip-switch": { fill: "rgba(21,94,117,0.4)", stroke: "#22d3ee" },
  misc: { fill: "rgba(74,85,104,0.35)", stroke: "#94a3b8" },
};

export const CATEGORY_LABELS: Record<PcbConnectorCategory, string> = {
  stepper: "Stepper",
  driver: "Driver",
  heater: "Heater",
  fan: "Fan",
  endstop: "Endstop",
  thermistor: "Thermistor",
  display: "Display",
  probe: "Probe",
  power: "Power",
  communication: "Communication",
  jumper: "Jumper",
  button: "Button",
  "dip-switch": "DIP Switch",
  misc: "Misc",
};
