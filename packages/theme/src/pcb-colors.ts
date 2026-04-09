export type PcbConnectorCategory =
  | "stepper"
  | "fan"
  | "heater"
  | "thermistor"
  | "endstop"
  | "display"
  | "probe"
  | "power"
  | "communication"
  | "driver"
  | "jumper"
  | "button"
  | "dip-switch"
  | "misc";

export interface PcbCategoryColor {
  base: string;
  active: string;
}

export const PCB_CATEGORY_COLORS: Record<PcbConnectorCategory, PcbCategoryColor> = {
  stepper: { base: "#6b21a8", active: "#a855f7" },
  fan: { base: "#1e40af", active: "#3b82f6" },
  heater: { base: "#991b1b", active: "#ef4444" },
  thermistor: { base: "#854d0e", active: "#eab308" },
  endstop: { base: "#166534", active: "#22c55e" },
  display: { base: "#4a5568", active: "#94a3b8" },
  probe: { base: "#0e7490", active: "#06b6d4" },
  power: { base: "#9a3412", active: "#f97316" },
  communication: { base: "#4a5568", active: "#94a3b8" },
  driver: { base: "#5b21b6", active: "#8b5cf6" },
  jumper: { base: "#92400e", active: "#d97706" },
  button: { base: "#b91c1c", active: "#f87171" },
  "dip-switch": { base: "#155e75", active: "#22d3ee" },
  misc: { base: "#4a5568", active: "#94a3b8" },
};
