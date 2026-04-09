import { resolveHeader, useConfig } from "@/context/config-context";
import { useMcu } from "@/context/mcu-context";
import { useEditorScroll } from "@klipperforge/editor";
import type { PcbLayout } from "@klipperforge/printer-data";
import { loadPcbLayout } from "@klipperforge/printer-data";
import {
  BookOpen,
  ImageIcon,
  ImageOff,
  Layers,
  List,
  Maximize2,
  PenTool,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { PcbBoard } from "./PcbBoard";
import type { PinAssignment } from "./PcbConnectorRect";
import { PcbPinOverview } from "./PcbPinOverview";
import { PcbTooltip } from "./PcbTooltip";
import type { ImageOpacity, Rotation } from "./pcb-types";
import { usePcbTooltip } from "./usePcbTooltip";
import { usePcbZoom } from "./usePcbZoom";

export function PcbBoardViewer() {
  const navigate = useNavigate();
  const { state: configState, dispatch: configDispatch } = useConfig();
  const { state, dispatch: mcuDispatch, getUsedPins, imageBoardIds, pcbBoardIds } = useMcu();
  const { scrollToField, expandAndScrollToSection } = useEditorScroll();
  const [layout, setLayout] = useState<PcbLayout | null>(null);
  const [imageOpacity, setImageOpacity] = useState<ImageOpacity>(1);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showPinOverview, setShowPinOverview] = useState(false);
  const [overviewHighlight, setOverviewHighlight] = useState<string | undefined>();

  const activeBoard = state.boards[state.activePcbBoard];
  const boardId = activeBoard?.boardId ?? "";
  const boardLabel =
    state.activePcbBoard === 0 ? "Primary MCU" : activeBoard?.alias || `MCU ${state.activePcbBoard + 1}`;

  const effectiveWidth = layout
    ? rotation === 90 || rotation === 270
      ? layout.viewBox.height
      : layout.viewBox.width
    : 0;
  const effectiveHeight = layout
    ? rotation === 90 || rotation === 270
      ? layout.viewBox.width
      : layout.viewBox.height
    : 0;

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
  } = usePcbZoom(effectiveWidth, effectiveHeight, { resetKey: boardId });

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

  const mainFile = configState.document.files?.[0] ?? "printer.cfg";

  const sectionFileMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of configState.document.sections) {
      const header = resolveHeader(section);
      map.set(header, section.file ?? mainFile);
    }
    return map;
  }, [configState.document.sections, mainFile]);

  const handlePinClick = useCallback(
    (assignment: PinAssignment) => {
      const sectionFile = sectionFileMap.get(assignment.section) ?? mainFile;
      const needsFileSwitch = sectionFile !== configState.activeFile;
      if (needsFileSwitch) {
        configDispatch({ type: "SET_ACTIVE_FILE", payload: { file: sectionFile } });
      }
      if (needsFileSwitch) {
        // Defer scroll until the editor remounts with the new file content
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToField(assignment.section, assignment.field);
          });
        });
      } else {
        scrollToField(assignment.section, assignment.field);
      }
      expandAndScrollToSection(assignment.section, assignment.field);
      dismiss();
    },
    [
      scrollToField,
      expandAndScrollToSection,
      dismiss,
      sectionFileMap,
      configState.activeFile,
      mainFile,
      configDispatch,
    ],
  );

  const cycleImageOpacity = useCallback(() => {
    setImageOpacity((prev) => (prev === 1 ? 0.5 : prev === 0.5 ? 0 : 1));
  }, []);

  const cycleRotation = useCallback(() => {
    setRotation((prev) => ((prev + 90) % 360) as Rotation);
  }, []);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);

  const togglePinOverview = useCallback(() => {
    setShowPinOverview((prev) => !prev);
  }, []);

  const usedPins = useMemo(() => getUsedPins(), [getUsedPins]);

  const jumperSelections = activeBoard?.jumperSelections;

  const handleJumperSelect = useCallback(
    (connectorName: string, label: string) => {
      const currentLabel = activeBoard?.jumperSelections?.[connectorName];
      mcuDispatch({
        type: "SET_JUMPER_SELECTION",
        payload: {
          index: state.activePcbBoard,
          connector: connectorName,
          label: currentLabel === label ? undefined : label,
        },
      });
    },
    [activeBoard, state.activePcbBoard, mcuDispatch],
  );

  const hasLayout = pcbBoardIds.has(boardId);
  const hasImage = imageBoardIds.has(boardId);
  const boardImageUrl = hasImage ? `/data/mcu-boards/images/${boardId}.png` : undefined;

  // Load PCB layout when board changes
  useEffect(
    function loadPcbLayoutEffect() {
      if (!boardId || !pcbBoardIds.has(boardId)) {
        setLayout(null);
        return;
      }

      async function load() {
        try {
          const data = await loadPcbLayout(boardId);
          setLayout(data);
        } catch {
          setLayout(null);
        }
      }
      load();
    },
    [boardId, pcbBoardIds],
  );

  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="mb-3 flex items-center gap-2 border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">{boardLabel}</span>
        {activeBoard?.board && (
          <>
            <span className="text-xs text-muted-foreground/60">{activeBoard.board.name}</span>
            <span className="text-xs text-muted-foreground/40">{activeBoard.board.mcu}</span>
          </>
        )}
        {boardId && !hasLayout && <span className="text-[10px] text-muted-foreground/50">(no interactive layout)</span>}
        {boardId && !boardId.startsWith("generic-") && (
          <button
            type="button"
            onClick={() => navigate(`/documentation?board=${boardId}`)}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground ${!layout ? "ml-auto" : ""}`}
            title="View documentation"
          >
            <BookOpen className="size-3.5" />
          </button>
        )}
        {layout && boardId && (
          <a
            href={`/pcb-designer/?${boardImageUrl ? `image=${encodeURIComponent(boardImageUrl)}&` : ""}layout=${boardId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Edit in PCB Designer"
          >
            <PenTool className="size-3.5" />
          </a>
        )}
        {layout && (
          <>
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
            <button
              type="button"
              onClick={togglePinOverview}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground ${showPinOverview ? "bg-muted text-foreground" : ""}`}
              title={`Pin overview: ${showPinOverview ? "visible" : "hidden"}`}
            >
              <List className="size-3.5" />
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
          </>
        )}
      </div>
      {layout ? (
        <div
          className={`relative min-h-0 flex-1 ${zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`}
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
            usedPins={usedPins}
            jumperSelections={jumperSelections}
            highlightedConnector={overviewHighlight ?? tooltip?.connector.name}
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
              jumperSelections={jumperSelections}
              onPinClick={handlePinClick}
              onJumperSelect={handleJumperSelect}
            />
          )}
          {showPinOverview && (
            <PcbPinOverview
              layout={layout}
              usedPins={usedPins}
              jumperSelections={jumperSelections}
              onPinClick={handlePinClick}
              onJumperSelect={handleJumperSelect}
              onConnectorHover={setOverviewHighlight}
              onConnectorLeave={() => setOverviewHighlight(undefined)}
            />
          )}
        </div>
      ) : !layout && boardImageUrl ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4">
          <img
            src={boardImageUrl}
            alt={activeBoard?.board?.name ?? boardId}
            className="max-h-full max-w-full object-contain"
          />
          <a
            href={`/pcb-designer/?image=${encodeURIComponent(boardImageUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <PenTool className="size-3" />
            Create a PCB layout in the Designer
          </a>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          {boardId ? (
            <>
              <span>No PCB layout or image available for this board</span>
              <a
                href="/pcb-designer/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <PenTool className="size-3" />
                Create one in the PCB Designer
              </a>
            </>
          ) : (
            "Select a board to view PCB layout"
          )}
        </div>
      )}
    </div>
  );
}
