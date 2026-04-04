import type { PcbConnector } from "@klipperforge/printer-data";

export type Rotation = 0 | 90 | 180 | 270;

export type ImageOpacity = 1 | 0.5 | 0;

export function getConnectorLabel(connector: PcbConnector): string {
  return connector.title ?? connector.name;
}
