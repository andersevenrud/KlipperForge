import { CATEGORY_COLORS } from "../constants";
import type { Connector } from "../types";

interface ConnectorListProps {
  connectors: Connector[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConnectorList({ connectors, selectedId, onSelect }: ConnectorListProps) {
  return (
    <div className="w-48 bg-zinc-900 border-r border-zinc-700 flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-700">
        <h3 className="text-white font-medium text-sm">Connectors</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {connectors.length === 0 && (
          <p className="px-3 py-4 text-zinc-500 text-xs">Draw rectangles on the canvas to add connectors.</p>
        )}
        {connectors.map((conn) => (
          <button
            type="button"
            key={conn.id}
            className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-zinc-800 ${
              conn.id === selectedId ? "bg-zinc-800 text-white" : "text-zinc-300"
            }`}
            onClick={() => onSelect(conn.id)}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[conn.category].stroke }}
            />
            <span className="truncate">{conn.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
