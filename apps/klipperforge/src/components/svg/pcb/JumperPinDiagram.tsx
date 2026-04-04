import type { JumperOption, PcbConnector } from "@klipperforge/printer-data";
import { CATEGORY_COLORS } from "./PcbConnectorRect";
import type { Rotation } from "./pcb-types";

type JumperDiagramSize = "sm" | "lg";

interface JumperPinDiagramProps {
  connector: PcbConnector;
  options: JumperOption[];
  size?: JumperDiagramSize;
  rotation?: Rotation;
}

export function isSpecialPin(pin: string): boolean {
  return pin.startsWith("<") && pin.endsWith(">");
}

export function formatPinLabel(pin: string): string {
  return isSpecialPin(pin) ? pin.slice(1, -1) : pin;
}

export function buildPinGrid(connector: PcbConnector): number[][] {
  const { pins, orientation, rows } = connector;
  if (rows <= 1) return [pins.map((_, i) => i)];

  if (orientation === "vertical") {
    const cols = rows;
    const rowCount = Math.ceil(pins.length / cols);
    const grid: number[][] = [];
    for (let r = 0; r < rowCount; r++) {
      const row: number[] = [];
      for (let c = 0; c < cols; c++) {
        const idx = c * rowCount + r;
        if (idx < pins.length) row.push(idx);
      }
      grid.push(row);
    }
    return grid;
  }

  const cols = Math.ceil(pins.length / rows);
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < pins.length) row.push(idx);
    }
    grid.push(row);
  }
  return grid;
}

export function rotateGrid(grid: number[][], rotation: Rotation): number[][] {
  if (rotation === 0 || grid.length === 0) return grid;

  const rows = grid.length;
  const cols = grid[0].length;

  if (rotation === 180) {
    return grid.map((row) => [...row].reverse()).reverse();
  }

  if (rotation === 90) {
    // Transpose + reverse each row: result[c][rows-1-r] = grid[r][c]
    const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(-1));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        result[c][rows - 1 - r] = grid[r][c];
      }
    }
    return result.filter((row) => row.some((v) => v >= 0));
  }

  // 270: Transpose + reverse columns: result[cols-1-c][r] = grid[r][c]
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(-1));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      result[cols - 1 - c][r] = grid[r][c];
    }
  }
  return result.filter((row) => row.some((v) => v >= 0));
}

function columnHasVerticalLink(pattern: number[][], ci: number): boolean {
  for (let ri = 0; ri < pattern.length - 1; ri++) {
    if (pattern[ri][ci] === 1 && pattern[ri + 1][ci] === 1) return true;
  }
  return false;
}

function cellRounding(pattern: number[][], ri: number, ci: number): string {
  const above = ri > 0 && pattern[ri - 1][ci] === 1;
  const below = ri < pattern.length - 1 && pattern[ri + 1][ci] === 1;
  const isVertical = columnHasVerticalLink(pattern, ci);
  const left = !isVertical && ci > 0 && pattern[ri][ci - 1] === 1;
  const right = !isVertical && ci < pattern[ri].length - 1 && pattern[ri][ci + 1] === 1;

  const tl = !above && !left ? "rounded-tl-full" : "";
  const tr = !above && !right ? "rounded-tr-full" : "";
  const bl = !below && !left ? "rounded-bl-full" : "";
  const br = !below && !right ? "rounded-br-full" : "";

  return [tl, tr, bl, br].filter(Boolean).join(" ");
}

interface PatternGridProps {
  pattern: number[][];
  color: string;
  size: JumperDiagramSize;
}

function PatternGrid({ pattern, color, size }: PatternGridProps) {
  const cellSize = size === "lg" ? "size-6" : "size-3";
  const dotSize = size === "lg" ? "size-4" : "size-2";

  return (
    <span className="flex flex-col">
      {pattern.map((row, ri) => (
        <span key={`row-${ri.toString()}`} className="flex">
          {row.map((cell, ci) => (
            <span
              key={`cell-${ci.toString()}`}
              className={`flex ${cellSize} items-center justify-center ${cell ? cellRounding(pattern, ri, ci) : ""}`}
              style={cell ? { backgroundColor: color } : undefined}
            >
              <span
                className={`${dotSize} rounded-full ${cell ? "bg-white" : "border border-foreground/25 bg-background"}`}
              />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function JumperPinDiagram({ connector, options, size = "sm", rotation = 0 }: JumperPinDiagramProps) {
  const grid = rotateGrid(buildPinGrid(connector), rotation);
  const hasPins = connector.pins.length > 0;
  const activeColor = CATEGORY_COLORS.jumper.active;
  const isLarge = size === "lg";

  const pinTextClass = isLarge ? "text-xs" : "text-[9px]";
  const labelTextClass = isLarge ? "text-xs" : "text-[9px]";
  const gapClass = isLarge ? "gap-x-4 gap-y-1" : "gap-x-3 gap-y-0.5";
  const itemGapClass = isLarge ? "gap-2" : "gap-1.5";
  const spacingClass = isLarge ? "space-y-2" : "space-y-1";

  return (
    <div className={spacingClass}>
      {hasPins && (
        <table className="border-separate border-spacing-px">
          <tbody>
            {grid.map((row, ri) => (
              <tr key={`pin-row-${ri.toString()}`}>
                {row.map((idx) => (
                  <td
                    key={`pin-${idx.toString()}`}
                    className={`rounded-sm bg-muted px-1 py-px text-center font-mono ${pinTextClass} text-muted-foreground`}
                  >
                    {formatPinLabel(connector.pins[idx])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={`flex flex-wrap items-start ${gapClass}`}>
        {options.map((option) => (
          <div key={option.label} className={`flex items-center ${itemGapClass}`}>
            <span className={`${labelTextClass} font-medium text-foreground/70`}>{option.label}</span>
            <PatternGrid pattern={rotateGrid(option.pattern, rotation)} color={activeColor} size={size} />
          </div>
        ))}
      </div>
    </div>
  );
}
