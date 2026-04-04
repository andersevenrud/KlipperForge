import type { PcbConnector, PcbLayout, PinUsage } from "@klipperforge/printer-data";
import { useMemo } from "react";
import type { PinAssignment } from "./PcbConnectorRect";
import { PcbConnectorRect } from "./PcbConnectorRect";
import type { Rotation } from "./pcb-types";

interface PcbBoardProps {
  layout: PcbLayout;
  boardImage?: string;
  imageOpacity?: number;
  rotation?: Rotation;
  showOverlay?: boolean;
  usedPins: Map<string, PinUsage>;
  highlightedConnector?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  viewBox?: string;
  onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
  onConnectorHover: (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => void;
  onConnectorLeave: () => void;
  onConnectorClick: (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => void;
}

function extractBaseNumber(name: string, category: string): string | null {
  if (category === "stepper") {
    const match = name.match(/^MOTOR(\d+)/i);
    return match ? match[1] : null;
  }
  if (category === "driver") {
    const match = name.match(/^DRIVER(\d+)/i);
    return match ? match[1] : null;
  }
  return null;
}

function computeRotationTransform(rotation: Rotation, w: number, h: number) {
  switch (rotation) {
    case 90:
      return { viewBox: `0 0 ${h} ${w}`, transform: `translate(${h}, 0) rotate(90)` };
    case 180:
      return { viewBox: `0 0 ${w} ${h}`, transform: `translate(${w}, ${h}) rotate(180)` };
    case 270:
      return { viewBox: `0 0 ${h} ${w}`, transform: `translate(0, ${w}) rotate(270)` };
    default:
      return { viewBox: `0 0 ${w} ${h}`, transform: undefined };
  }
}

export function PcbBoard({
  layout,
  boardImage,
  imageOpacity = 1,
  rotation = 0,
  showOverlay = true,
  usedPins,
  highlightedConnector,
  svgRef,
  viewBox: viewBoxOverride,
  onPointerDown,
  onConnectorHover,
  onConnectorLeave,
  onConnectorClick,
}: PcbBoardProps) {
  const { viewBox, connectors } = layout;

  const pairingMap = useMemo(() => {
    const byBase = new Map<string, PcbConnector[]>();
    for (const c of connectors) {
      const base = extractBaseNumber(c.name, c.category);
      if (base === null) continue;
      const list = byBase.get(base);
      if (list) {
        list.push(c);
      } else {
        byBase.set(base, [c]);
      }
    }

    const map = new Map<string, PcbConnector[]>();
    for (const group of byBase.values()) {
      if (group.length < 2) continue;
      for (const c of group) {
        map.set(
          c.name,
          group.filter((o) => o.name !== c.name),
        );
      }
    }
    return map;
  }, [connectors]);

  const connectionLines = useMemo(() => {
    if (!highlightedConnector) return [];
    const paired = pairingMap.get(highlightedConnector);
    if (!paired) return [];

    const source = connectors.find((c) => c.name === highlightedConnector);
    if (!source) return [];

    const sx = source.x + source.width / 2;
    const sy = source.y + source.height / 2;

    return paired.map((target) => ({
      key: `${source.name}-${target.name}`,
      x1: sx,
      y1: sy,
      x2: target.x + target.width / 2,
      y2: target.y + target.height / 2,
    }));
  }, [highlightedConnector, pairingMap, connectors]);

  const rotationTransform = computeRotationTransform(rotation, viewBox.width, viewBox.height);

  return (
    <svg
      ref={svgRef}
      viewBox={viewBoxOverride ?? rotationTransform.viewBox}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`PCB layout for ${layout.name}`}
      onPointerDown={onPointerDown}
    >
      <g transform={rotationTransform.transform}>
        {boardImage && imageOpacity > 0 && (
          <image
            href={boardImage}
            x={layout.imageOffset?.x ?? 0}
            y={layout.imageOffset?.y ?? 0}
            width={viewBox.width}
            height={viewBox.height}
            preserveAspectRatio="xMidYMid meet"
            opacity={imageOpacity}
          />
        )}

        {showOverlay && (
          <>
            {/* Driver-to-motor connection lines */}
            {connectionLines.map((line) => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#facc15"
                strokeOpacity={0.9}
                strokeWidth={1}
                strokeDasharray="2 1.5"
              />
            ))}

            {/* Connectors */}
            {connectors.map((connector) => (
              <PcbConnectorRect
                key={`${connector.name}-${connector.x}-${connector.y}`}
                connector={connector}
                rotation={rotation}
                highlighted={highlightedConnector === connector.name}
                usedPins={usedPins}
                onHover={onConnectorHover}
                onLeave={onConnectorLeave}
                onClick={onConnectorClick}
              />
            ))}
          </>
        )}
      </g>
    </svg>
  );
}
