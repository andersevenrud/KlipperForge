import type { PcbConnector, PinUsage } from "@klipperforge/printer-data";
import { PCB_CATEGORY_COLORS } from "@klipperforge/theme";
import { memo } from "react";
import { isSpecialPin } from "./JumperPinDiagram";
import { type Rotation, getConnectorLabel } from "./pcb-types";

export { PCB_CATEGORY_COLORS as CATEGORY_COLORS } from "@klipperforge/theme";

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
  const colors = PCB_CATEGORY_COLORS[connector.category];
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
