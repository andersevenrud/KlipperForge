import { useCallback, useEffect, useRef, useState } from "react";

interface ViewBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UsePcbZoomOptions {
  resetKey?: string | number;
  onZoomChange?: () => void;
}

interface UsePcbZoomResult {
  svgRef: React.RefObject<SVGSVGElement | null>;
  viewBox: string;
  zoom: number;
  isPanning: boolean;
  wasPanning: () => boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  onPointerDown: React.PointerEventHandler<SVGSVGElement>;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.2;

function clampViewBox(rect: ViewBoxRect, baseWidth: number, baseHeight: number): ViewBoxRect {
  const width = Math.min(rect.width, baseWidth);
  const height = Math.min(rect.height, baseHeight);
  const x = Math.max(0, Math.min(rect.x, baseWidth - width));
  const y = Math.max(0, Math.min(rect.y, baseHeight - height));
  return { x, y, width, height };
}

export function usePcbZoom(baseWidth: number, baseHeight: number, options?: UsePcbZoomOptions): UsePcbZoomResult {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [rect, setRect] = useState<ViewBoxRect>({ x: 0, y: 0, width: baseWidth, height: baseHeight });
  const [isPanning, setIsPanning] = useState(false);
  const panEndTimeRef = useRef(0);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; rect: ViewBoxRect } | null>(null);
  const onZoomChangeRef = useRef(options?.onZoomChange);
  onZoomChangeRef.current = options?.onZoomChange;

  // Refs for stable access in event handlers (avoids stale closure in onPointerDown)
  const rectRef = useRef(rect);
  rectRef.current = rect;
  const baseRef = useRef({ width: baseWidth, height: baseHeight });
  baseRef.current = { width: baseWidth, height: baseHeight };

  // Track active pointer listeners for cleanup on unmount
  const cleanupRef = useRef<(() => void) | null>(null);

  // Reset when base dimensions or resetKey change (rotation, board switch)
  const resetKey = options?.resetKey;
  useEffect(
    function resetOnDimensionChangeEffect() {
      // resetKey triggers reset when the source (e.g. board) changes even if dimensions stay the same
      void resetKey;
      setRect({ x: 0, y: 0, width: baseWidth, height: baseHeight });
    },
    [baseWidth, baseHeight, resetKey],
  );

  // Clean up pointer listeners on unmount
  useEffect(function cleanupOnUnmountEffect() {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const zoom = baseWidth / rect.width;

  const applyZoom = useCallback(
    (factor: number, centerX?: number, centerY?: number) => {
      setRect((prev) => {
        const newWidth = baseWidth / Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (baseWidth / prev.width) * factor));
        const newHeight = baseHeight / Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (baseHeight / prev.height) * factor));

        // Default center to viewBox center
        const cx = centerX ?? prev.x + prev.width / 2;
        const cy = centerY ?? prev.y + prev.height / 2;

        // Keep the point under cursor fixed
        const newX = cx - (cx - prev.x) * (newWidth / prev.width);
        const newY = cy - (cy - prev.y) * (newHeight / prev.height);

        return clampViewBox({ x: newX, y: newY, width: newWidth, height: newHeight }, baseWidth, baseHeight);
      });
      onZoomChangeRef.current?.();
    },
    [baseWidth, baseHeight],
  );

  const zoomIn = useCallback(() => {
    applyZoom(ZOOM_STEP);
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    applyZoom(1 / ZOOM_STEP);
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    setRect({ x: 0, y: 0, width: baseWidth, height: baseHeight });
    onZoomChangeRef.current?.();
  }, [baseWidth, baseHeight]);

  // Wheel zoom — attached natively for { passive: false }
  useEffect(
    function wheelZoomEffect() {
      const svg = svgRef.current;
      if (!svg) return;

      function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const boundingRect = svgEl.getBoundingClientRect();

        // Normalize deltaY across input devices: mouse wheels emit large discrete
        // values (~100px), while trackpads emit many small continuous values (~1-5px).
        // Scale the zoom factor proportionally so both feel natural.
        let delta = -e.deltaY;
        if (e.deltaMode === 1) delta *= 40;
        const factor = ZOOM_STEP ** (delta / 100);

        // Convert mouse position to viewBox coordinates
        setRect((prev) => {
          const mouseXRatio = (e.clientX - boundingRect.left) / boundingRect.width;
          const mouseYRatio = (e.clientY - boundingRect.top) / boundingRect.height;
          const cursorX = prev.x + mouseXRatio * prev.width;
          const cursorY = prev.y + mouseYRatio * prev.height;

          const currentZoom = baseWidth / prev.width;
          const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor));
          const newWidth = baseWidth / newZoom;
          const newHeight = baseHeight / newZoom;

          const newX = cursorX - (cursorX - prev.x) * (newWidth / prev.width);
          const newY = cursorY - (cursorY - prev.y) * (newHeight / prev.height);

          return clampViewBox({ x: newX, y: newY, width: newWidth, height: newHeight }, baseWidth, baseHeight);
        });
        onZoomChangeRef.current?.();
      }

      svg.addEventListener("wheel", handleWheel, { passive: false });
      return () => svg.removeEventListener("wheel", handleWheel);
    },
    [baseWidth, baseHeight],
  );

  // Stable onPointerDown — reads from refs instead of closing over rect/zoom.
  // Delays pointer capture until actual movement is detected so clicks on child
  // elements (connector rects) still propagate normally.
  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = useCallback((e) => {
    const currentZoom = baseRef.current.width / rectRef.current.width;
    if (currentZoom <= 1 || e.button !== 0) return;

    const target = e.currentTarget;
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = { ...rectRef.current };
    let captured = false;

    function handlePointerMove(ev: PointerEvent) {
      const svg = svgRef.current;
      if (!svg) return;

      // Only start panning after a small movement threshold
      if (!captured) {
        const dist = Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY);
        if (dist < 3) return;
        target.setPointerCapture(pointerId);
        captured = true;
        setIsPanning(true);
        panStartRef.current = { pointerX: startX, pointerY: startY, rect: startRect };
      }

      const start = panStartRef.current;
      if (!start) return;

      const boundingRect = svg.getBoundingClientRect();
      const scaleX = start.rect.width / boundingRect.width;
      const scaleY = start.rect.height / boundingRect.height;

      const dx = (ev.clientX - start.pointerX) * scaleX;
      const dy = (ev.clientY - start.pointerY) * scaleY;

      setRect(
        clampViewBox(
          {
            x: start.rect.x - dx,
            y: start.rect.y - dy,
            width: start.rect.width,
            height: start.rect.height,
          },
          baseRef.current.width,
          baseRef.current.height,
        ),
      );
    }

    function handlePointerUp() {
      if (captured) panEndTimeRef.current = Date.now();
      setIsPanning(false);
      panStartRef.current = null;
      cleanupRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    cleanupRef.current = handlePointerUp;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);

  const wasPanning = useCallback(() => Date.now() - panEndTimeRef.current < 100, []);

  const viewBox = `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;

  return {
    svgRef,
    viewBox,
    zoom,
    isPanning,
    wasPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    onPointerDown,
  };
}
