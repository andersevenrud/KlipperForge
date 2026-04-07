import { DocPcbViewer } from "@/components/documentation/DocPcbViewer";
import { useMcu } from "@/context/mcu-context";
import type { PcbLayout } from "@klipperforge/printer-data";
import { loadPcbLayout } from "@klipperforge/printer-data";
import { useEffect, useMemo, useState } from "react";

interface LoadedBoard {
  index: number;
  label: string;
  layout: PcbLayout;
}

export function SharedPcbStrip() {
  const { state, pcbBoardIds, getUsedPins } = useMcu();
  const [loadedBoards, setLoadedBoards] = useState<LoadedBoard[]>([]);

  const usedPins = useMemo(() => getUsedPins(), [getUsedPins]);

  const boardsWithLayouts = useMemo(
    () =>
      state.boards
        .map((board, index) => ({ boardId: board.boardId, index }))
        .filter(({ boardId }) => pcbBoardIds.has(boardId)),
    [state.boards, pcbBoardIds],
  );

  useEffect(
    function loadPcbLayoutsEffect() {
      if (boardsWithLayouts.length === 0) {
        setLoadedBoards([]);
        return;
      }

      let cancelled = false;

      async function loadAll() {
        const results: LoadedBoard[] = [];
        for (const { boardId, index } of boardsWithLayouts) {
          try {
            const layout = await loadPcbLayout(boardId);
            const board = state.boards[index];
            const label = index === 0 ? "Primary MCU" : board?.alias || `MCU ${index + 1}`;
            results.push({ index, label, layout });
          } catch {
            // Skip boards whose layout fails to load
          }
        }
        if (!cancelled) {
          setLoadedBoards(results);
        }
      }

      loadAll();
      return () => {
        cancelled = true;
      };
    },
    [boardsWithLayouts, state.boards],
  );

  if (loadedBoards.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl gap-4 overflow-x-auto">
      {loadedBoards.map((board) => (
        <div key={board.index} className="min-w-[28rem] flex-1">
          <DocPcbViewer layout={board.layout} usedPins={usedPins} className="h-80" label={board.label} />
        </div>
      ))}
    </div>
  );
}
