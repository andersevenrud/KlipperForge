import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "./components/Canvas";
import { ConnectorList } from "./components/ConnectorList";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Toolbar } from "./components/Toolbar";
import { parseJson, parseSvg } from "./export/import-svg";
import { downloadSvg, generateSvg } from "./export/svg";
import { useCanvasState } from "./hooks/useCanvasState";
import { useGrid } from "./hooks/useGrid";
import type { CanvasMode, GridConfig } from "./types";

export function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<CanvasMode>("draw");
  const [grid, setGrid] = useState<GridConfig>({ enabled: true, size: 10 });

  const {
    connectors,
    selected,
    selectedId,
    addConnector,
    updateConnector,
    deleteConnector,
    duplicateConnector,
    selectConnector,
    findConnectorAt,
    importConnectors,
  } = useCanvasState();

  const { snap } = useGrid(grid);

  const layoutParamRef = useRef(new URLSearchParams(window.location.search).get("layout"));
  const layoutImportedRef = useRef(false);

  // Load background image from URL param (e.g. ?image=/data/mcu-boards/images/board.png)
  useEffect(function loadImageFromUrlEffect() {
    const params = new URLSearchParams(window.location.search);
    const imageUrl = params.get("image");
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => setImage(img);
    img.src = imageUrl;
  }, []);

  const handleExport = useCallback(() => {
    if (!image) return;
    const svg = generateSvg(connectors, image.naturalWidth, image.naturalHeight);
    downloadSvg(svg, "pcb-layout.svg");
  }, [connectors, image]);

  const handleImport = useCallback(
    (text: string) => {
      const trimmed = text.trimStart();
      const result = trimmed.startsWith("{") ? parseJson(trimmed) : parseSvg(trimmed);

      if (image && result.viewBoxWidth > 0 && result.viewBoxHeight > 0) {
        const scaleX = image.naturalWidth / result.viewBoxWidth;
        const scaleY = image.naturalHeight / result.viewBoxHeight;
        for (const c of result.connectors) {
          c.x = Math.round(c.x * scaleX * 100) / 100;
          c.y = Math.round(c.y * scaleY * 100) / 100;
          c.width = Math.round(c.width * scaleX * 100) / 100;
          c.height = Math.round(c.height * scaleY * 100) / 100;
        }
      }

      importConnectors(result.connectors);
    },
    [importConnectors, image],
  );

  // Import layout from URL param after image is loaded (e.g. ?layout=btt-skr-mini-e3-v3)
  useEffect(
    function loadLayoutFromUrlEffect() {
      const layoutId = layoutParamRef.current;
      if (!layoutId || !image || layoutImportedRef.current) return;
      layoutImportedRef.current = true;

      async function fetchLayout() {
        try {
          const res = await fetch(`/data/pcb-layouts/${layoutId}.json`);
          if (!res.ok) return;
          const text = await res.text();
          handleImport(text);
        } catch {
          // silently ignore fetch errors
        }
      }
      fetchLayout();
    },
    [image, handleImport],
  );

  // Keyboard shortcuts
  useEffect(
    function keyboardShortcutsEffect() {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

        switch (e.key) {
          case "Delete":
          case "Backspace":
            if (selectedId) {
              e.preventDefault();
              deleteConnector(selectedId);
            }
            break;
          case "Escape":
            selectConnector(null);
            break;
          case "d":
            if (selectedId) {
              duplicateConnector(selectedId);
            }
            break;
          case "g":
            setGrid((prev) => ({ ...prev, enabled: !prev.enabled }));
            break;
          case "v":
            setMode("select");
            break;
          case "r":
            setMode("draw");
            break;
          case "ArrowUp":
          case "ArrowDown":
          case "ArrowLeft":
          case "ArrowRight":
            if (selectedId && selected) {
              e.preventDefault();
              if (e.shiftKey) {
                const dw = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
                const dh = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                updateConnector(selectedId, {
                  width: Math.max(1, selected.width + dw),
                  height: Math.max(1, selected.height + dh),
                });
              } else {
                const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
                const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                updateConnector(selectedId, { x: selected.x + dx, y: selected.y + dy });
              }
            }
            break;
        }
      }

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    },
    [selectedId, selected, deleteConnector, selectConnector, duplicateConnector, updateConnector],
  );

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      <Toolbar
        grid={grid}
        zoom={zoom}
        mode={mode}
        connectorCount={connectors.length}
        onGridChange={setGrid}
        onZoomChange={setZoom}
        onModeChange={setMode}
        onImageLoad={setImage}
        onImportSvg={handleImport}
        onExport={handleExport}
      />
      <div className="flex-1 flex overflow-hidden relative">
        <ConnectorList connectors={connectors} selectedId={selectedId} onSelect={selectConnector} />
        <Canvas
          image={image}
          connectors={connectors}
          selectedId={selectedId}
          grid={grid}
          zoom={zoom}
          mode={mode}
          onAddConnector={addConnector}
          onSelectConnector={selectConnector}
          onUpdateConnector={updateConnector}
          onFindConnectorAt={findConnectorAt}
          snap={snap}
        />
        {selectedId && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10 rounded bg-zinc-800/80 px-3 py-1 text-[11px] text-zinc-400">
            Arrow keys to move &middot; Shift+Arrow to resize
          </div>
        )}
        <PropertiesPanel
          connector={selected}
          onUpdate={updateConnector}
          onDelete={deleteConnector}
          onDuplicate={duplicateConnector}
        />
      </div>
    </div>
  );
}
