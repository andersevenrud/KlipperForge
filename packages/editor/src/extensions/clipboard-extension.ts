import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

interface InverseMapEntry {
  header: string;
  field?: string;
}

export function createClipboardExtension(
  onCutRef: { current: ((headers: string[]) => void) | null },
  onPasteRef: { current: ((text: string, afterHeader?: string) => void) | null },
  inverseMapRef: { current: Map<number, InverseMapEntry> },
): Extension {
  return EditorView.domEventHandlers({
    cut(event, view) {
      const { from, to } = view.state.selection.main;
      if (from === to) return false;

      const text = view.state.sliceDoc(from, to);
      event.clipboardData?.setData("text/plain", text);

      const startLine = view.state.doc.lineAt(from).number;
      const endLine = view.state.doc.lineAt(to).number;
      const currentInverseMap = inverseMapRef.current;

      const headers = new Set<string>();
      for (let i = startLine; i <= endLine; i++) {
        const entry = currentInverseMap.get(i);
        if (entry) {
          headers.add(entry.header);
        }
      }

      if (headers.size > 0) {
        onCutRef.current?.([...headers]);
      }

      event.preventDefault();
      return true;
    },

    paste(event, view) {
      const text = event.clipboardData?.getData("text/plain");
      if (!text) return false;

      // Find which section the cursor is in for positional paste
      const pos = view.state.selection.main.head;
      const lineNum = view.state.doc.lineAt(pos).number;
      const currentInverseMap = inverseMapRef.current;
      let cursorHeader: string | undefined;
      for (let i = lineNum; i >= 1; i--) {
        const entry = currentInverseMap.get(i);
        if (entry?.header) {
          cursorHeader = entry.header;
          break;
        }
      }

      onPasteRef.current?.(text, cursorHeader);
      event.preventDefault();
      return true;
    },
  });
}
