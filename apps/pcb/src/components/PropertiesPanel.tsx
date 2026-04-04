import { CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";
import type { Connector, PcbConnectorCategory } from "../types";

interface PropertiesPanelProps {
  connector: Connector | null;
  onUpdate: (id: string, updates: Partial<Connector>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function PropertiesPanel({ connector, onUpdate, onDelete, onDuplicate }: PropertiesPanelProps) {
  if (!connector) {
    return (
      <div className="w-64 bg-zinc-900 border-l border-zinc-700 p-3 text-zinc-500 text-sm">
        Select a connector to edit its properties, or draw a new one.
      </div>
    );
  }

  const update = (updates: Partial<Connector>) => onUpdate(connector.id, updates);

  return (
    <div className="w-64 bg-zinc-900 border-l border-zinc-700 p-3 flex flex-col gap-2.5 text-sm overflow-y-auto">
      <h3 className="text-white font-medium text-base">Properties</h3>

      <Field label="Name">
        <input
          type="text"
          value={connector.name}
          onChange={(e) => update({ name: e.target.value })}
          className="input"
        />
      </Field>

      <Field label="Title">
        <input
          type="text"
          value={connector.title}
          onChange={(e) => update({ title: e.target.value })}
          className="input"
          placeholder="Optional display title"
        />
      </Field>

      <Field label="Category">
        <select
          value={connector.category}
          onChange={(e) => update({ category: e.target.value as PcbConnectorCategory })}
          className="input"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <div
          className="w-4 h-4 rounded border border-zinc-600 shrink-0"
          style={{ backgroundColor: CATEGORY_COLORS[connector.category].stroke }}
        />
      </Field>

      <Field label="Pins (comma-sep)">
        <input
          type="text"
          value={connector.pins}
          onChange={(e) => update({ pins: e.target.value })}
          className="input"
          placeholder="<24V>,PA2"
        />
      </Field>

      <Field label="Pin Hints">
        <input
          type="text"
          value={connector.pinHints}
          onChange={(e) => update({ pinHints: e.target.value })}
          className="input"
          placeholder="EN,STEP,DIR,CS"
        />
      </Field>

      <Field label="Orientation">
        <select
          value={connector.orientation}
          onChange={(e) => update({ orientation: e.target.value as "horizontal" | "vertical" })}
          className="input"
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </Field>

      <Field label="Rotation">
        <input
          type="number"
          value={connector.rotation}
          onChange={(e) => update({ rotation: Number(e.target.value) || 0 })}
          className="input w-20"
        />
        <span className="text-zinc-500">deg</span>
      </Field>

      <Field label="Rows">
        <input
          type="number"
          min={1}
          max={10}
          value={connector.rows}
          onChange={(e) => update({ rows: Number(e.target.value) || 1 })}
          className="input w-20"
        />
      </Field>

      <div className="border-t border-zinc-700 pt-2 mt-1">
        <p className="text-zinc-400 mb-1.5">Position & Size</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="X" inline>
            <input
              type="number"
              value={Math.round(connector.x * 100) / 100}
              onChange={(e) => update({ x: Number(e.target.value) })}
              className="input w-full"
            />
          </Field>
          <Field label="Y" inline>
            <input
              type="number"
              value={Math.round(connector.y * 100) / 100}
              onChange={(e) => update({ y: Number(e.target.value) })}
              className="input w-full"
            />
          </Field>
          <Field label="W" inline>
            <input
              type="number"
              value={Math.round(connector.width * 100) / 100}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="input w-full"
            />
          </Field>
          <Field label="H" inline>
            <input
              type="number"
              value={Math.round(connector.height * 100) / 100}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="input w-full"
            />
          </Field>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white"
          onClick={() => onDuplicate(connector.id)}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="flex-1 px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-white"
          onClick={() => onDelete(connector.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  inline?: boolean;
  children: React.ReactNode;
}

function Field({ label, inline, children }: FieldProps) {
  if (inline) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-zinc-400 w-5">{label}</span>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-zinc-400">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}
