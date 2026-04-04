import { useCallback, useState } from "react";
import type { Connector, PcbConnectorCategory } from "../types";

let nextId = 1;

export function useCanvasState() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = connectors.find((c) => c.id === selectedId) ?? null;

  const addConnector = useCallback((x: number, y: number, width: number, height: number) => {
    const id = `conn_${nextId++}`;
    const connector: Connector = {
      id,
      name: `UNNAMED_${nextId - 1}`,
      title: "",
      category: "misc",
      x,
      y,
      width,
      height,
      pins: "",
      pinHints: "",
      orientation: width > height ? "horizontal" : "vertical",
      rotation: 0,
      rows: 1,
    };
    setConnectors((prev) => [...prev, connector]);
    setSelectedId(id);
    return id;
  }, []);

  const updateConnector = useCallback((id: string, updates: Partial<Connector>) => {
    setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteConnector = useCallback((id: string) => {
    setConnectors((prev) => prev.filter((c) => c.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const duplicateConnector = useCallback(
    (id: string) => {
      const source = connectors.find((c) => c.id === id);
      if (!source) return;
      const newId = `conn_${nextId++}`;
      const copy: Connector = {
        ...source,
        id: newId,
        name: `${source.name}_copy`,
        x: source.x + 10,
        y: source.y + 10,
      };
      setConnectors((prev) => [...prev, copy]);
      setSelectedId(newId);
    },
    [connectors],
  );

  const selectConnector = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const findConnectorAt = useCallback(
    (x: number, y: number): Connector | null => {
      // Search in reverse so topmost (last drawn) is found first
      for (let i = connectors.length - 1; i >= 0; i--) {
        const c = connectors[i];
        if (!c) continue;
        if (x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height) {
          return c;
        }
      }
      return null;
    },
    [connectors],
  );

  const setCategory = useCallback(
    (id: string, category: PcbConnectorCategory) => {
      updateConnector(id, { category });
    },
    [updateConnector],
  );

  const importConnectors = useCallback((imported: Connector[]) => {
    // Update nextId to avoid collisions
    nextId = Math.max(nextId, imported.length + 1);
    setConnectors(imported);
    setSelectedId(null);
  }, []);

  return {
    connectors,
    selected,
    selectedId,
    addConnector,
    updateConnector,
    deleteConnector,
    duplicateConnector,
    selectConnector,
    findConnectorAt,
    setCategory,
    importConnectors,
  };
}
