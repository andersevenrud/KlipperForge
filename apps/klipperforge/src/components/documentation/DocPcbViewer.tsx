import { PcbBoard } from "@/components/svg/pcb/PcbBoard";
import { PcbTooltip } from "@/components/svg/pcb/PcbTooltip";
import type { ImageOpacity, Rotation } from "@/components/svg/pcb/pcb-types";
import { usePcbTooltip } from "@/components/svg/pcb/usePcbTooltip";
import { usePcbZoom } from "@/components/svg/pcb/usePcbZoom";
import { cn } from "@/lib/utils";
import type { PcbLayout, PinUsage } from "@klipperforge/printer-data";
import { ImageIcon, ImageOff, Layers, Maximize2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useState } from "react";

interface DocPcbViewerProps {
  layout: PcbLayout;
  usedPins?: Map<string, PinUsage>;
  className?: string;
  label?: string;
}

const emptyPins: Map<string, PinUsage> = new Map();

export function DocPcbViewer({ layout, usedPins, className, label }: DocPcbViewerProps) {
  const [imageOpacity, setImageOpacity] = useState<ImageOpacity>(1);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [showOverlay, setShowOverlay] = useState(true);

  const effectiveWidth = rotation === 90 || rotation === 270 ? layout.viewBox.height : layout.viewBox.width;
  const effectiveHeight = rotation === 90 || rotation === 270 ? layout.viewBox.width : layout.viewBox.height;

  const {
    svgRef,
    viewBox: zoomViewBox,
    zoom,
    isPanning,
    wasPanning,
    zoomIn,
    zoomOut,
    resetZoom,
    onPointerDown,
  } = usePcbZoom(effectiveWidth, effectiveHeight, { resetKey: layout.name });

  const {
    tooltip,
    dismissPinned,
    dismiss,
    handleConnectorHover,
    handleConnectorLeave,
    handleConnectorClick,
    handlePaneClick,
    handlePaneLeave,
  } = usePcbTooltip(svgRef);

  const cycleImageOpacity = useCallback(() => {
    setImageOpacity((prev) => (prev === 1 ? 0.5 : prev === 0.5 ? 0 : 1));
  }, []);

  const cycleRotation = useCallback(() => {
    setRotation((prev) => ((prev + 90) % 360) as Rotation);
  }, []);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);

  return (
    <div className={cn("flex h-[28rem] flex-col rounded bg-muted/50", className)}>
      <div className="flex items-center gap-1 px-3 py-1.5">
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <button
          type="button"
          onClick={cycleRotation}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          title={`Rotate board (${rotation}°)`}
        >
          <RotateCw className="size-3.5" />
          {rotation > 0 && <span className="text-[10px] leading-none">{rotation}°</span>}
        </button>
        <button
          type="button"
          onClick={cycleImageOpacity}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          title={`Board image: ${imageOpacity === 1 ? "visible" : imageOpacity === 0.5 ? "faded" : "hidden"}`}
        >
          {imageOpacity === 0 ? <ImageOff className="size-3.5" /> : <ImageIcon className="size-3.5" />}
          {imageOpacity === 0.5 && <span className="text-[10px] leading-none">50%</span>}
        </button>
        <button
          type="button"
          onClick={toggleOverlay}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground ${showOverlay ? "bg-muted text-foreground" : ""}`}
          title={`Connector overlay: ${showOverlay ? "visible" : "hidden"}`}
        >
          <Layers className="size-3.5" />
        </button>
        <span className="mx-1 h-4 border-l border-border" />
        <button
          type="button"
          onClick={zoomIn}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Zoom in"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Zoom out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground ${zoom > 1 ? "text-foreground" : ""}`}
          title="Reset zoom"
        >
          <Maximize2 className="size-3.5" />
          <span className="text-[10px] leading-none">{zoom.toFixed(1)}x</span>
        </button>
      </div>
      <div
        className={`relative min-h-0 flex-1 p-3 ${zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onMouseLeave={handlePaneLeave}
        onClick={() => !wasPanning() && handlePaneClick()}
        onKeyDown={(e) => e.key === "Escape" && dismiss()}
        role="presentation"
      >
        <PcbBoard
          layout={layout}
          boardImage={layout.image}
          imageOpacity={imageOpacity}
          rotation={rotation}
          showOverlay={showOverlay}
          usedPins={usedPins ?? emptyPins}
          highlightedConnector={tooltip?.connector.name}
          svgRef={svgRef}
          viewBox={zoomViewBox}
          onPointerDown={onPointerDown}
          onConnectorHover={handleConnectorHover}
          onConnectorLeave={handleConnectorLeave}
          onConnectorClick={handleConnectorClick}
        />
        {tooltip && (
          <PcbTooltip
            connector={tooltip.connector}
            assignments={tooltip.assignments}
            x={tooltip.x}
            y={tooltip.y}
            pinned={tooltip.pinned}
            rotation={rotation}
            jumperConfigs={layout.jumperConfigs}
          />
        )}
      </div>
    </div>
  );
}
