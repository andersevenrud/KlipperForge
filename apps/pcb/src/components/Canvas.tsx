import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS } from "../constants";
import type { CanvasMode, Connector, GridConfig } from "../types";

interface CanvasProps {
  image: HTMLImageElement | null;
  connectors: Connector[];
  selectedId: string | null;
  grid: GridConfig;
  zoom: number;
  mode: CanvasMode;
  onAddConnector: (x: number, y: number, w: number, h: number) => void;
  onSelectConnector: (id: string | null) => void;
  onUpdateConnector: (id: string, updates: Partial<Connector>) => void;
  onFindConnectorAt: (x: number, y: number) => Connector | null;
  onZoomChange: (zoom: number) => void;
  snap: (value: number) => number;
}

interface DragState {
  type: "draw" | "move" | "resize";
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  connectorId?: string;
  origX?: number;
  origY?: number;
  origW?: number;
  origH?: number;
  handle?: string;
}

const HANDLE_SIZE = 6;

export function Canvas({
  image,
  connectors,
  selectedId,
  grid,
  zoom,
  mode,
  onAddConnector,
  onSelectConnector,
  onUpdateConnector,
  onFindConnectorAt,
  onZoomChange,
  snap,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const fittedImageRef = useRef<HTMLImageElement | null>(null);

  const imageWidth = image?.naturalWidth ?? 800;
  const imageHeight = image?.naturalHeight ?? 600;

  // Fit image to viewport when a new image loads
  useEffect(
    function fitImageToViewportEffect() {
      if (!image || image === fittedImageRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      fittedImageRef.current = image;

      const padding = 40;
      const containerW = container.clientWidth - padding;
      const containerH = container.clientHeight - padding;
      const fitZoom = Math.min(containerW / image.naturalWidth, containerH / image.naturalHeight);
      const panX = (container.clientWidth - image.naturalWidth * fitZoom) / 2;
      const panY = (container.clientHeight - image.naturalHeight * fitZoom) / 2;

      onZoomChange(fitZoom);
      setPan({ x: panX, y: panY });
    },
    [image, onZoomChange],
  );

  const toCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [zoom, pan],
  );

  const getResizeHandle = useCallback(
    (conn: Connector, x: number, y: number): string | null => {
      const hs = HANDLE_SIZE / zoom;
      const cx = conn.x;
      const cy = conn.y;
      const cw = conn.width;
      const ch = conn.height;

      if (Math.abs(x - cx) < hs && Math.abs(y - cy) < hs) return "nw";
      if (Math.abs(x - (cx + cw)) < hs && Math.abs(y - cy) < hs) return "ne";
      if (Math.abs(x - cx) < hs && Math.abs(y - (cy + ch)) < hs) return "sw";
      if (Math.abs(x - (cx + cw)) < hs && Math.abs(y - (cy + ch)) < hs) return "se";
      return null;
    },
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        return;
      }
      if (e.button !== 0) return;

      const { x, y } = toCanvas(e.clientX, e.clientY);

      // Check resize handles on selected connector
      if (selectedId) {
        const sel = connectors.find((c) => c.id === selectedId);
        if (sel) {
          const handle = getResizeHandle(sel, x, y);
          if (handle) {
            setDrag({
              type: "resize",
              startX: x,
              startY: y,
              currentX: x,
              currentY: y,
              connectorId: sel.id,
              origX: sel.x,
              origY: sel.y,
              origW: sel.width,
              origH: sel.height,
              handle,
            });
            return;
          }
        }
      }

      // Check if clicking on a connector
      const hit = onFindConnectorAt(x, y);
      if (hit) {
        onSelectConnector(hit.id);
        setDrag({
          type: "move",
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          connectorId: hit.id,
          origX: hit.x,
          origY: hit.y,
        });
        return;
      }

      // Start drawing new rect
      if (mode === "draw") {
        const sx = snap(x);
        const sy = snap(y);
        setDrag({
          type: "draw",
          startX: sx,
          startY: sy,
          currentX: sx,
          currentY: sy,
        });
        onSelectConnector(null);
      } else {
        onSelectConnector(null);
      }
    },
    [toCanvas, mode, selectedId, connectors, onFindConnectorAt, onSelectConnector, snap, pan, getResizeHandle],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
        return;
      }

      const d = dragRef.current;
      if (!d) return;

      const { x, y } = toCanvas(e.clientX, e.clientY);
      const sx = snap(x);
      const sy = snap(y);

      setDrag({ ...d, currentX: sx, currentY: sy });

      if (d.type === "move" && d.connectorId && d.origX !== undefined && d.origY !== undefined) {
        const dx = sx - snap(d.startX);
        const dy = sy - snap(d.startY);
        onUpdateConnector(d.connectorId, {
          x: snap(d.origX + dx),
          y: snap(d.origY + dy),
        });
      }

      if (d.type === "resize" && d.connectorId && d.handle) {
        const ox = d.origX ?? 0;
        const oy = d.origY ?? 0;
        const ow = d.origW ?? 0;
        const oh = d.origH ?? 0;
        let nx = ox;
        let ny = oy;
        let nw = ow;
        let nh = oh;

        if (d.handle.includes("w")) {
          nx = sx;
          nw = ox + ow - sx;
        }
        if (d.handle.includes("e")) {
          nw = sx - ox;
        }
        if (d.handle.includes("n")) {
          ny = sy;
          nh = oy + oh - sy;
        }
        if (d.handle.includes("s")) {
          nh = sy - oy;
        }

        if (nw > 0 && nh > 0) {
          onUpdateConnector(d.connectorId, { x: nx, y: ny, width: nw, height: nh });
        }
      }
    },
    [toCanvas, snap, isPanning, onUpdateConnector],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    const d = dragRef.current;
    if (d?.type === "draw") {
      const x = Math.min(d.startX, d.currentX);
      const y = Math.min(d.startY, d.currentY);
      const w = Math.abs(d.currentX - d.startX);
      const h = Math.abs(d.currentY - d.startY);
      if (w > 2 && h > 2) {
        onAddConnector(snap(x), snap(y), snap(w), snap(h));
      }
    }
    setDrag(null);
  }, [isPanning, onAddConnector, snap]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
  }, []);

  // Render canvas
  // biome-ignore lint/correctness/useExhaustiveDependencies: drag triggers re-render for in-progress drawing
  useEffect(
    function renderCanvasEffect() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayW = canvas.clientWidth;
      const displayH = canvas.clientHeight;
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clear
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, displayW, displayH);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw image
      if (image) {
        ctx.drawImage(image, 0, 0);
      }

      // Draw grid
      if (grid.enabled) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 0.5 / zoom;
        for (let x = 0; x <= imageWidth; x += grid.size) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, imageHeight);
          ctx.stroke();
        }
        for (let y = 0; y <= imageHeight; y += grid.size) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(imageWidth, y);
          ctx.stroke();
        }
      }

      // Draw connectors
      for (const conn of connectors) {
        const colors = CATEGORY_COLORS[conn.category];
        const isSelected = conn.id === selectedId;
        const cx = conn.x + conn.width / 2;
        const cy = conn.y + conn.height / 2;
        const hasRotation = conn.rotation !== 0;

        if (hasRotation) {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((conn.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        ctx.fillStyle = colors.fill;
        ctx.strokeStyle = isSelected ? "#fff" : colors.stroke;
        ctx.lineWidth = isSelected ? 2 / zoom : 1 / zoom;
        ctx.fillRect(conn.x, conn.y, conn.width, conn.height);
        ctx.strokeRect(conn.x, conn.y, conn.width, conn.height);

        // Label
        const fontSize = Math.max(10, Math.min(14, conn.height * 0.4));
        ctx.fillStyle = "#fff";
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText(conn.name, conn.x + 3, conn.y + conn.height / 2, conn.width - 6);

        // Resize handles on selected
        if (isSelected) {
          const hs = HANDLE_SIZE / zoom;
          ctx.fillStyle = "#fff";
          const handles: [number, number][] = [
            [conn.x, conn.y],
            [conn.x + conn.width, conn.y],
            [conn.x, conn.y + conn.height],
            [conn.x + conn.width, conn.y + conn.height],
          ];
          for (const [hx, hy] of handles) {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
          }
        }

        if (hasRotation) {
          ctx.restore();
        }
      }

      // Draw in-progress rectangle
      const d = dragRef.current;
      if (d?.type === "draw") {
        const x = Math.min(d.startX, d.currentX);
        const y = Math.min(d.startY, d.currentY);
        const w = Math.abs(d.currentX - d.startX);
        const h = Math.abs(d.currentY - d.startY);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      ctx.restore();
    },
    [image, connectors, selectedId, grid, zoom, pan, drag, imageWidth, imageHeight],
  );

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative cursor-crosshair">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
