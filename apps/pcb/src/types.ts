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

export interface Connector {
  id: string;
  name: string;
  title: string;
  category: PcbConnectorCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  pins: string;
  pinHints: string;
  orientation: "horizontal" | "vertical";
  rotation: number;
  rows: number;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
}

export type CanvasMode = "draw" | "select";
