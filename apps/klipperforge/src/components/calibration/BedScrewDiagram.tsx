interface ScrewPoint {
  x: number;
  y: number;
  name: string;
}

interface BedScrewDiagramProps {
  bedWidth: number;
  bedHeight: number;
  screws: ScrewPoint[];
  probeOffset: { x: number; y: number };
}

const PADDING = 40;
const LABEL_OFFSET = 16;

export function BedScrewDiagram({ bedWidth, bedHeight, screws, probeOffset }: BedScrewDiagramProps) {
  const svgWidth = bedWidth + PADDING * 2;
  const svgHeight = bedHeight + PADDING * 2 + 30;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      className="mt-4 max-w-md"
      style={{ aspectRatio: `${svgWidth} / ${svgHeight}` }}
      role="img"
      aria-label="Bed screw positions diagram"
    >
      <rect
        x={PADDING}
        y={PADDING}
        width={bedWidth}
        height={bedHeight}
        rx={6}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />

      <text
        x={PADDING + bedWidth / 2}
        y={PADDING - 8}
        textAnchor="middle"
        fontSize={10}
        fill="var(--color-muted-foreground)"
      >
        {bedWidth} x {bedHeight} mm
      </text>

      <line
        x1={PADDING}
        y1={PADDING + bedHeight + LABEL_OFFSET}
        x2={PADDING + 30}
        y2={PADDING + bedHeight + LABEL_OFFSET}
        stroke="var(--color-muted-foreground)"
        strokeWidth={1}
        markerEnd="url(#arrowhead)"
      />
      <text
        x={PADDING + 34}
        y={PADDING + bedHeight + LABEL_OFFSET + 4}
        fontSize={10}
        fill="var(--color-muted-foreground)"
      >
        X
      </text>

      <line
        x1={PADDING - LABEL_OFFSET}
        y1={PADDING + bedHeight}
        x2={PADDING - LABEL_OFFSET}
        y2={PADDING + bedHeight - 30}
        stroke="var(--color-muted-foreground)"
        strokeWidth={1}
        markerEnd="url(#arrowhead)"
      />
      <text
        x={PADDING - LABEL_OFFSET - 4}
        y={PADDING + bedHeight - 34}
        fontSize={10}
        textAnchor="middle"
        fill="var(--color-muted-foreground)"
      >
        Y
      </text>

      <circle cx={PADDING} cy={PADDING + bedHeight} r={3} fill="var(--color-muted-foreground)" />

      <defs>
        <marker id="arrowhead" markerWidth={6} markerHeight={4} refX={5} refY={2} orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-muted-foreground)" />
        </marker>
      </defs>

      {screws.map((screw, i) => {
        const physX = PADDING + screw.x;
        const physY = PADDING + bedHeight - screw.y;
        const adjX = PADDING + (screw.x - probeOffset.x);
        const adjY = PADDING + bedHeight - (screw.y - probeOffset.y);
        const hasOffset = probeOffset.x !== 0 || probeOffset.y !== 0;

        return (
          <g key={screw.name || i}>
            {hasOffset && (
              <line
                x1={physX}
                y1={physY}
                x2={adjX}
                y2={adjY}
                stroke="var(--color-muted-foreground)"
                strokeWidth={0.75}
                strokeDasharray="3 2"
              />
            )}

            <circle cx={physX} cy={physY} r={5} fill="var(--color-primary)" />

            {hasOffset && (
              <circle cx={adjX} cy={adjY} r={5} fill="none" stroke="var(--color-primary)" strokeWidth={1.5} />
            )}

            <text x={physX} y={physY - 9} textAnchor="middle" fontSize={9} fill="var(--color-foreground)">
              {screw.name || `Screw ${i + 1}`}
            </text>

            {i === 0 && hasOffset && (
              <line
                x1={physX}
                y1={physY}
                x2={adjX}
                y2={adjY}
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                markerEnd="url(#offset-arrow)"
              />
            )}
          </g>
        );
      })}

      <defs>
        <marker id="offset-arrow" markerWidth={6} markerHeight={4} refX={5} refY={2} orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="var(--color-primary)" />
        </marker>
      </defs>

      <g transform={`translate(${PADDING}, ${PADDING + bedHeight + 26})`}>
        <circle cx={0} cy={0} r={4} fill="var(--color-primary)" />
        <text x={8} y={4} fontSize={9} fill="var(--color-muted-foreground)">
          Physical screw
        </text>
        <circle cx={100} cy={0} r={4} fill="none" stroke="var(--color-primary)" strokeWidth={1.5} />
        <text x={108} y={4} fontSize={9} fill="var(--color-muted-foreground)">
          Nozzle position (config)
        </text>
      </g>
    </svg>
  );
}
