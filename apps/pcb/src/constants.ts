import { PCB_CATEGORY_COLORS } from "@klipperforge/theme";
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

function hexToFill(hex: string, opacity: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export const CATEGORY_COLORS: Record<PcbConnectorCategory, { fill: string; stroke: string }> = Object.fromEntries(
  Object.entries(PCB_CATEGORY_COLORS).map(([key, { base, active }]) => [
    key,
    { fill: hexToFill(base, 0.4), stroke: active },
  ]),
) as Record<PcbConnectorCategory, { fill: string; stroke: string }>;

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
