import { useEffect } from "react";
import { useConfig } from "@/context/config-context";

export function useUndoRedoHotkeys(): void {
  const { dispatch } = useConfig();

  useEffect(
    function undoRedoHotkeyEffect() {
      function handleKeyDown(event: KeyboardEvent) {
        const modifier = event.metaKey || event.ctrlKey;
        if (!modifier) return;
        const key = event.key.toLowerCase();
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          dispatch({ type: "UNDO" });
          return;
        }
        if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          dispatch({ type: "REDO" });
        }
      }

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    },
    [dispatch],
  );
}
