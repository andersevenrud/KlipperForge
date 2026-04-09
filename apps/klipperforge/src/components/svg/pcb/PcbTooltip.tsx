import type { JumperOption, PcbConnector, PinUsage } from "@klipperforge/printer-data";
import { createPortal } from "react-dom";
import { DipSwitchDiagram } from "./DipSwitchDiagram";
import { buildPinGrid, JumperPinDiagram, rotateGrid } from "./JumperPinDiagram";
import type { PinAssignment } from "./PcbConnectorRect";
import { getConnectorLabel, type Rotation } from "./pcb-types";

interface PcbTooltipProps {
  connector: PcbConnector;
  assignments: PinAssignment[];
  x: number;
  y: number;
  pinned?: boolean;
  rotation?: Rotation;
  jumperConfigs?: Record<string, JumperOption[]>;
  jumperSelections?: Record<string, string>;
  onPinClick?: (assignment: PinAssignment) => void;
  onJumperSelect?: (connectorName: string, label: string) => void;
}

interface PinLabelProps {
  pin: string;
  hint?: string;
  usage?: PinUsage;
  pinned?: boolean;
  onPinClick?: (assignment: PinAssignment) => void;
}

function PinLabel({ pin, hint, usage, pinned, onPinClick }: PinLabelProps) {
  const usageContent = usage && (
    <>
      <span className="text-emerald-400">[{usage.section}]</span> <span className="text-sky-400">{usage.field}</span>
    </>
  );

  return (
    <>
      <span className="text-muted-foreground/40 mr-1">&bull;</span>
      <span className={usage ? "text-foreground" : "text-muted-foreground"}>{pin}</span>
      {hint && <span className="text-muted-foreground"> ({hint})</span>}
      {usage && " "}
      {pinned && usage && onPinClick ? (
        <button
          type="button"
          className="cursor-pointer rounded px-0.5 hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onPinClick({ pin, hint, ...usage });
          }}
        >
          {usageContent}
        </button>
      ) : (
        usageContent
      )}
    </>
  );
}

type PinDirection = "ltr" | "rtl" | "ttb" | "btt";

const PIN_DIRECTIONS: Record<string, Record<Rotation, PinDirection>> = {
  horizontal: { 0: "ltr", 90: "ttb", 180: "rtl", 270: "btt" },
  vertical: { 0: "ttb", 90: "rtl", 180: "btt", 270: "ltr" },
};

const DIRECTION_ARROWS: Record<PinDirection, string> = {
  ltr: "\u2192",
  rtl: "\u2190",
  ttb: "\u2193",
  btt: "\u2191",
};

const DIRECTION_LABELS: Record<PinDirection, string> = {
  ltr: "From left to right",
  rtl: "From right to left",
  ttb: "From top to bottom",
  btt: "From bottom to top",
};

export function PcbTooltip({
  connector,
  assignments,
  x,
  y,
  pinned,
  rotation = 0,
  jumperConfigs,
  jumperSelections,
  onPinClick,
  onJumperSelect,
}: PcbTooltipProps) {
  const assignmentsByPin = new Map(assignments.map((a) => [a.pin, a]));
  const combinedRotation = (((rotation + (connector.rotation ?? 0)) % 360) + 360) % 360;
  const snappedRotation = (Math.round(combinedRotation / 90) * 90) % 360;
  const direction = PIN_DIRECTIONS[connector.orientation]?.[snappedRotation as Rotation] ?? "ltr";
  const directionArrow = DIRECTION_ARROWS[direction];
  const directionLabel = DIRECTION_LABELS[direction];
  const rawGroups = buildPinGrid(connector);
  const groups = rotateGrid(rawGroups, rotation);
  const isMultiRow = connector.rows > 1;
  const effectiveHorizontal =
    rotation === 0 || rotation === 180
      ? connector.orientation === "horizontal"
      : connector.orientation !== "horizontal";

  return createPortal(
    <div
      className={`${pinned ? "pointer-events-auto" : "pointer-events-none"} fixed z-50 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md`}
      style={{ left: x + 12, top: y + 12 }}
    >
      <div className={connector.pins.length > 0 ? "mb-1 font-semibold" : "font-semibold"}>
        {getConnectorLabel(connector)}
      </div>
      {connector.pins.length === 0 ? null : (
        <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-base leading-none">{directionArrow}</span>
          <span className="italic">{directionLabel}</span>
        </div>
      )}
      {connector.pins.length === 0 ? null : isMultiRow ? (
        <table className="border-separate border-spacing-0">
          {!effectiveHorizontal && (
            <thead>
              <tr>
                {Array.from({ length: groups[0]?.length ?? 0 }, (_, i) => (
                  <th
                    key={`col-${(i + 1).toString()}`}
                    className="px-1.5 py-0.5 text-left text-xs font-medium text-muted-foreground"
                  >
                    Row {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {effectiveHorizontal
              ? groups.map((row, ri) => (
                  <tr key={`row-${ri.toString()}`}>
                    <td className="pr-1.5 py-0.5 text-xs font-medium text-muted-foreground">Row {ri + 1}</td>
                    {row.map((idx) => (
                      <td key={`pin-${idx.toString()}`} className="px-1.5 py-0.5 font-mono text-xs">
                        <PinLabel
                          pin={connector.pins[idx]}
                          hint={connector.pinHints?.[idx]}
                          usage={assignmentsByPin.get(connector.pins[idx])}
                          pinned={pinned}
                          onPinClick={onPinClick}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : groups.map((row, ri) => (
                  <tr key={`row-${ri.toString()}`}>
                    {row.map((idx) => (
                      <td key={`pin-${idx.toString()}`} className="px-1.5 py-0.5 font-mono text-xs">
                        <PinLabel
                          pin={connector.pins[idx]}
                          hint={connector.pinHints?.[idx]}
                          usage={assignmentsByPin.get(connector.pins[idx])}
                          pinned={pinned}
                          onPinClick={onPinClick}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      ) : (
        <ul className="space-y-0.5">
          {groups.flat().map((idx) => (
            <li key={`pin-${idx.toString()}`} className="font-mono text-xs">
              <PinLabel
                pin={connector.pins[idx]}
                hint={connector.pinHints?.[idx]}
                usage={assignmentsByPin.get(connector.pins[idx])}
                pinned={pinned}
                onPinClick={onPinClick}
              />
            </li>
          ))}
        </ul>
      )}
      {connector.category === "jumper" && jumperConfigs?.[connector.name] && (
        <div className="mt-1.5 border-t border-border pt-1.5">
          <JumperPinDiagram
            connector={connector}
            options={jumperConfigs[connector.name]}
            rotation={rotation}
            selectedLabel={jumperSelections?.[connector.name]}
            onSelectOption={onJumperSelect ? (label) => onJumperSelect(connector.name, label) : undefined}
          />
        </div>
      )}
      {connector.category === "dip-switch" && jumperConfigs?.[connector.name] && (
        <div className="mt-1.5 border-t border-border pt-1.5">
          <DipSwitchDiagram
            options={jumperConfigs[connector.name]}
            selectedLabel={jumperSelections?.[connector.name]}
            onSelectOption={onJumperSelect ? (label) => onJumperSelect(connector.name, label) : undefined}
          />
        </div>
      )}
      {pinned && assignments.length > 0 && (
        <div className="mt-1.5 text-[10px] text-muted-foreground/60 italic">Click a pin assignment to navigate</div>
      )}
    </div>,
    document.body,
  );
}
