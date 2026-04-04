import type { PcbConnector } from "@klipperforge/printer-data";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PinAssignment } from "./PcbConnectorRect";

interface TooltipState {
  connector: PcbConnector;
  assignments: PinAssignment[];
  x: number;
  y: number;
  pinned: boolean;
  /** SVG-space coordinates for pinned tooltips (survives zoom/pan) */
  svgX?: number;
  svgY?: number;
}

export function usePcbTooltip(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const pinnedScreenPos = useRef<{ x: number; y: number } | null>(null);
  const [, forceRender] = useState(0);

  // After every DOM commit, recompute pinned tooltip screen position from SVG coords
  useLayoutEffect(function updatePinnedPositionEffect() {
    if (!tooltip?.pinned || tooltip.svgX == null || tooltip.svgY == null) {
      pinnedScreenPos.current = null;
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = tooltip.svgX;
    point.y = tooltip.svgY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const screen = point.matrixTransform(ctm);

    // Dismiss if the pinned point has been panned outside the SVG's visible bounds
    const bounds = svg.getBoundingClientRect();
    if (screen.x < bounds.left || screen.x > bounds.right || screen.y < bounds.top || screen.y > bounds.bottom) {
      pinnedScreenPos.current = null;
      setTooltip(null);
      return;
    }

    const prev = pinnedScreenPos.current;

    // Only trigger re-render if position actually changed
    if (!prev || Math.abs(prev.x - screen.x) > 0.5 || Math.abs(prev.y - screen.y) > 0.5) {
      pinnedScreenPos.current = { x: screen.x, y: screen.y };
      forceRender((n) => n + 1);
    }
  });

  // Dismiss pinned tooltip when the PCB area scrolls out of view
  useEffect(
    function dismissWhenOutOfViewEffect() {
      const svg = svgRef.current;
      if (!svg) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            setTooltip((prev) => (prev?.pinned ? null : prev));
          }
        },
        { threshold: 0 },
      );

      observer.observe(svg);
      return () => observer.disconnect();
    },
    [svgRef],
  );

  const screenToSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const svgPoint = point.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    },
    [svgRef],
  );

  const dismissPinned = useCallback(() => {
    setTooltip((prev) => (prev?.pinned ? null : prev));
  }, []);

  const handleConnectorHover = useCallback(
    (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => {
      setTooltip((prev) => {
        if (prev?.pinned) return prev;
        return { connector, assignments, x: event.clientX, y: event.clientY, pinned: false };
      });
    },
    [],
  );

  const handleConnectorLeave = useCallback(() => {
    setTooltip((prev) => (prev?.pinned ? prev : null));
  }, []);

  const handleConnectorClick = useCallback(
    (connector: PcbConnector, assignments: PinAssignment[], event: React.MouseEvent) => {
      const svgCoords = screenToSvg(event.clientX, event.clientY);
      setTooltip((prev) => {
        if (prev?.pinned && prev.connector.name === connector.name) return null;
        return {
          connector,
          assignments,
          x: event.clientX,
          y: event.clientY,
          pinned: true,
          svgX: svgCoords?.x,
          svgY: svgCoords?.y,
        };
      });
    },
    [screenToSvg],
  );

  const handlePaneClick = useCallback(() => {
    setTooltip((prev) => (prev?.pinned ? null : prev));
  }, []);

  const handlePaneLeave = useCallback(() => {
    setTooltip((prev) => (prev?.pinned ? prev : null));
  }, []);

  const dismiss = useCallback(() => {
    setTooltip(null);
  }, []);

  // Use recomputed screen position for pinned tooltips
  const resolvedTooltip =
    tooltip?.pinned && pinnedScreenPos.current
      ? { ...tooltip, x: pinnedScreenPos.current.x, y: pinnedScreenPos.current.y }
      : tooltip;

  return {
    tooltip: resolvedTooltip,
    dismissPinned,
    dismiss,
    handleConnectorHover,
    handleConnectorLeave,
    handleConnectorClick,
    handlePaneClick,
    handlePaneLeave,
  };
}
