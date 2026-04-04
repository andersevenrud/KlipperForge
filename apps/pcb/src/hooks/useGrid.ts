import { useCallback } from "react";
import type { GridConfig } from "../types";

export function useGrid(grid: GridConfig) {
  const snap = useCallback(
    (value: number): number => {
      if (!grid.enabled) return value;
      return Math.round(value / grid.size) * grid.size;
    },
    [grid.enabled, grid.size],
  );

  return { snap };
}
