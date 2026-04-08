import type { PcbConnector, PcbConnectorCategory, PinUsage } from "@klipperforge/printer-data";
import { memo } from "react";
import { isSpecialPin } from "./JumperPinDiagram";
import { type Rotation, getConnectorLabel } from "./pcb-types";

export const CATEGORY_COLORS: Record<PcbConnectorCategory, { base: string; active: string }> = {
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

export interface PinAssignment extends PinUsage {
  pin: string;
  hint?: string;
}

interface PcbConnectorRectProps {
  connector: PcbConnector;
  rotation?: Rotation;
  highlighted?: boolean;
  hasSelection?: boolean;
  usedPins: Map<string, PinUsage>;
  onHover: (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => void;
}

export const PcbConnectorRect = memo(function PcbConnectorRect({
  connector,
  rotation = 0,
  highlighted = false,
  hasSelection = false,
  usedPins,
  onHover,
  onLeave,
  onClick,
}: PcbConnectorRectProps) {
  const assignments: PinAssignment[] = [];
  for (let i = 0; i < connector.pins.length; i++) {
    const pin = connector.pins[i];
    if (isSpecialPin(pin)) continue;
    const usage = usedPins.get(pin);
    if (usage) {
      assignments.push({
        pin,
        hint: connector.pinHints?.[i],
        ...usage,
      });
    }
  }

  const isActive = assignments.length > 0 || hasSelection;
  const colors = CATEGORY_COLORS[connector.category];
  const fill = highlighted ? colors.active : isActive ? colors.active : colors.base;
  const opacity = highlighted ? 0.95 : isActive ? 0.85 : 0.4;
  const strokeWidth = highlighted ? 1 : isActive ? 0.6 : 0.3;

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(connector, assignments, e);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(connector, assignments, e);
  };

  const fontSize = Math.min(connector.width / (connector.name.length * 0.6), connector.height * 0.28);
  const cx = connector.x + connector.width / 2;
  const cy = connector.y + connector.height / 2;
  const connectorRotation = connector.rotation ?? 0;
  const totalTextRotation = -(rotation + connectorRotation);

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)}
      className="cursor-pointer"
      transform={connectorRotation ? `rotate(${connectorRotation}, ${cx}, ${cy})` : undefined}
    >
      <title>{getConnectorLabel(connector)}</title>
      <rect
        x={connector.x}
        y={connector.y}
        width={connector.width}
        height={connector.height}
        rx={0.5}
        fill={fill}
        fillOpacity={opacity}
        stroke={isActive ? "#fff" : "#666"}
        strokeWidth={strokeWidth}
      />
      {connector.category !== "jumper" && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={fontSize}
          fontFamily="monospace"
          fontWeight={isActive ? "bold" : "normal"}
          transform={totalTextRotation ? `rotate(${totalTextRotation}, ${cx}, ${cy})` : undefined}
        >
          {connector.name}
        </text>
      )}
    </g>
  );
});
