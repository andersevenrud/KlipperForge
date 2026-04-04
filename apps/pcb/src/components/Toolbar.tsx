import { useCallback, useRef } from "react";
import type { CanvasMode, GridConfig } from "../types";

interface ToolbarProps {
  grid: GridConfig;
  zoom: number;
  mode: CanvasMode;
  connectorCount: number;
  onGridChange: (grid: GridConfig) => void;
  onZoomChange: (zoom: number) => void;
  onModeChange: (mode: CanvasMode) => void;
  onImageLoad: (img: HTMLImageElement) => void;
  onImportSvg: (text: string) => void;
  onExport: () => void;
}

export function Toolbar({
  grid,
  zoom,
  mode,
  connectorCount,
  onGridChange,
  onZoomChange,
  onModeChange,
  onImageLoad,
  onImportSvg,
  onExport,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const svgFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => onImageLoad(img);
      img.src = URL.createObjectURL(file);
    },
    [onImageLoad],
  );

  const handleSvgImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onImportSvg(reader.result);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onImportSvg],
  );

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-900 border-b border-zinc-700 text-sm">
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white"
        onClick={() => fileRef.current?.click()}
      >
        Load Image
      </button>

      <input ref={svgFileRef} type="file" accept=".svg,.json" className="hidden" onChange={handleSvgImport} />
      <button
        type="button"
        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white"
        onClick={() => svgFileRef.current?.click()}
      >
        Import
      </button>

      <div className="w-px h-5 bg-zinc-700" />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className={mode === "draw" ? "text-white font-medium" : "text-zinc-400"}>Draw</span>
          <input
            type="checkbox"
            className="sr-only"
            checked={mode === "select"}
            onChange={(e) => onModeChange(e.target.checked ? "select" : "draw")}
          />
          <div
            className={`w-8 h-4 rounded-full relative transition-colors ${mode === "select" ? "bg-blue-600" : "bg-zinc-600"}`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${mode === "select" ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </div>
          <span className={mode === "select" ? "text-white font-medium" : "text-zinc-400"}>Select</span>
        </label>
      </div>

      <div className="w-px h-5 bg-zinc-700" />

      <label className="flex items-center gap-1.5 text-zinc-300">
        <input
          type="checkbox"
          checked={grid.enabled}
          onChange={(e) => onGridChange({ ...grid, enabled: e.target.checked })}
          className="accent-blue-500"
        />
        Grid
      </label>
      <input
        type="number"
        min={1}
        max={100}
        value={grid.size}
        onChange={(e) => onGridChange({ ...grid, size: Number(e.target.value) || 10 })}
        className="w-14 px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-white text-center"
      />

      <div className="w-px h-5 bg-zinc-700" />

      <label className="flex items-center gap-1.5 text-zinc-300">
        Zoom
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="w-10 text-right">{Math.round(zoom * 100)}%</span>
      </label>

      <div className="flex-1" />

      <span className="text-zinc-500">{connectorCount} connectors</span>

      <button
        type="button"
        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium"
        onClick={onExport}
      >
        Export SVG
      </button>
    </div>
  );
}
