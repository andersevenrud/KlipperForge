import type { PcbConnectorCategory, PcbLayout, PinUsage } from "@klipperforge/printer-data";
import { useMemo } from "react";
import { DipSwitchDiagram } from "./DipSwitchDiagram";
import { buildPinGrid, formatPinLabel, isSpecialPin, JumperPinDiagram } from "./JumperPinDiagram";
import { CATEGORY_COLORS, type PinAssignment } from "./PcbConnectorRect";
import { getConnectorLabel } from "./pcb-types";

interface PcbPinOverviewProps {
  layout: PcbLayout;
  usedPins: Map<string, PinUsage>;
  jumperSelections?: Record<string, string>;
  onPinClick: (assignment: PinAssignment) => void;
  onJumperSelect?: (connectorName: string, label: string) => void;
  onConnectorHover?: (connectorName: string) => void;
  onConnectorLeave?: () => void;
}

interface PinOverviewEntry {
  pin: string;
  hint?: string;
  usage?: PinUsage;
}

const CATEGORY_LABELS: Record<PcbConnectorCategory, string> = {
  stepper: "Steppers",
  fan: "Fans",
  heater: "Heaters",
  thermistor: "Thermistors",
  endstop: "Endstops",
  display: "Display",
  probe: "Probe",
  power: "Power",
  communication: "Communication",
  driver: "Drivers",
  jumper: "Jumpers",
  button: "Buttons",
  "dip-switch": "DIP Switches",
  misc: "Misc",
};

export function PcbPinOverview({
  layout,
  usedPins,
  jumperSelections,
  onPinClick,
  onJumperSelect,
  onConnectorHover,
  onConnectorLeave,
}: PcbPinOverviewProps) {
  const grouped = useMemo(() => {
    const map = new Map<PcbConnectorCategory, typeof layout.connectors>();
    for (const connector of layout.connectors) {
      const list = map.get(connector.category);
      if (list) {
        list.push(connector);
      } else {
        map.set(connector.category, [connector]);
      }
    }
    return map;
  }, [layout.connectors]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 max-h-[50%] overflow-y-auto border-t bg-background/90 backdrop-blur-sm md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:max-h-none md:w-[280px] md:border-t-0 md:border-l">
      <div className="p-3">
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Pin Overview</h3>
        {Array.from(grouped.entries()).map(([category, connectors]) => {
          const colors = CATEGORY_COLORS[category];
          return (
            <div key={category} className="mb-3">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-sm" style={{ backgroundColor: colors.active }} />
                <span className="text-[11px] font-medium text-foreground">{CATEGORY_LABELS[category]}</span>
              </div>
              <div className="space-y-1">
                {connectors.map((connector) => {
                  if (connector.category === "jumper") {
                    if (connector.pins.length === 0) return null;
                    const options = layout.jumperConfigs?.[connector.name];
                    if (options) {
                      return (
                        <div
                          key={`${connector.name}-${connector.x}-${connector.y}`}
                          className="rounded bg-muted/50 px-2 py-1"
                          onMouseEnter={() => onConnectorHover?.(connector.name)}
                          onMouseLeave={onConnectorLeave}
                        >
                          <div className="text-[11px] font-medium text-foreground/80">
                            {getConnectorLabel(connector)}
                          </div>
                          <div className="mt-0.5">
                            <JumperPinDiagram
                              connector={connector}
                              options={options}
                              selectedLabel={jumperSelections?.[connector.name]}
                              onSelectOption={
                                onJumperSelect ? (label) => onJumperSelect(connector.name, label) : undefined
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                    const grid = buildPinGrid(connector);
                    return (
                      <div
                        key={`${connector.name}-${connector.x}-${connector.y}`}
                        className="rounded bg-muted/50 px-2 py-1"
                        onMouseEnter={() => onConnectorHover?.(connector.name)}
                        onMouseLeave={onConnectorLeave}
                      >
                        <div className="text-[11px] font-medium text-foreground/80">{getConnectorLabel(connector)}</div>
                        <table className="mt-0.5 border-separate border-spacing-px">
                          <tbody>
                            {grid.map((row, ri) => (
                              <tr key={`row-${ri.toString()}`}>
                                {row.map((idx) => (
                                  <td
                                    key={`pin-${idx.toString()}`}
                                    className="rounded-sm bg-muted px-1 py-px text-center font-mono text-[9px] text-muted-foreground"
                                  >
                                    {formatPinLabel(connector.pins[idx])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (connector.category === "dip-switch") {
                    const options = layout.jumperConfigs?.[connector.name];
                    if (options) {
                      return (
                        <div
                          key={`${connector.name}-${connector.x}-${connector.y}`}
                          className="rounded bg-muted/50 px-2 py-1"
                          onMouseEnter={() => onConnectorHover?.(connector.name)}
                          onMouseLeave={onConnectorLeave}
                        >
                          <div className="text-[11px] font-medium text-foreground/80">
                            {getConnectorLabel(connector)}
                          </div>
                          <div className="mt-0.5">
                            <DipSwitchDiagram
                              options={options}
                              selectedLabel={jumperSelections?.[connector.name]}
                              onSelectOption={
                                onJumperSelect ? (label) => onJumperSelect(connector.name, label) : undefined
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }

                  if (connector.category === "button") {
                    return (
                      <div
                        key={`${connector.name}-${connector.x}-${connector.y}`}
                        className="rounded bg-muted/50 px-2 py-1"
                        onMouseEnter={() => onConnectorHover?.(connector.name)}
                        onMouseLeave={onConnectorLeave}
                      >
                        <div className="text-[11px] font-medium text-foreground/80">{getConnectorLabel(connector)}</div>
                      </div>
                    );
                  }

                  const pins = connector.pins
                    .map((pin, i) => {
                      if (isSpecialPin(pin)) return null;
                      const usage = usedPins.get(pin);
                      return {
                        pin,
                        hint: connector.pinHints?.[i],
                        usage,
                      };
                    })
                    .filter(Boolean) as PinOverviewEntry[];

                  if (pins.length === 0) return null;

                  return (
                    <div
                      key={`${connector.name}-${connector.x}-${connector.y}`}
                      className="rounded bg-muted/50 px-2 py-1"
                      onMouseEnter={() => onConnectorHover?.(connector.name)}
                      onMouseLeave={onConnectorLeave}
                    >
                      <div className="text-[11px] font-medium text-foreground/80">{getConnectorLabel(connector)}</div>
                      <div className="mt-0.5 space-y-px">
                        {pins.map((p) => (
                          <div key={p.pin} className="flex items-center gap-1 text-[10px]">
                            {p.usage ? (
                              <button
                                type="button"
                                className="flex min-w-0 items-center gap-1 text-left text-emerald-400 hover:text-emerald-300"
                                onClick={() => {
                                  const { section, field } = p.usage as PinUsage;
                                  onPinClick({ pin: p.pin, hint: p.hint, section, field });
                                }}
                              >
                                <span className="shrink-0 font-mono text-muted-foreground">{p.pin}</span>
                                {p.hint && <span className="shrink-0 text-muted-foreground/60">{p.hint}</span>}
                                <span className="truncate font-medium">
                                  [{p.usage.section}] {p.usage.field}
                                </span>
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 text-muted-foreground/50">
                                <span className="font-mono">{p.pin}</span>
                                {p.hint && <span className="text-muted-foreground/40">{p.hint}</span>}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
