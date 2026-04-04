import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { ExternalChange } from "@uiw/react-codemirror";
import type { MutableRefObject } from "react";

export function createScrollPreserveExtension(savedScrollTopRef: MutableRefObject<number | null>) {
  return ViewPlugin.fromClass(
    class {
      #scrollTop = 0;
      #scrollDOM: Element;
      #onScroll = () => {
        this.#scrollTop = this.#scrollDOM.scrollTop;
      };

      constructor(view: EditorView) {
        this.#scrollDOM = view.scrollDOM;
        this.#scrollTop = this.#scrollDOM.scrollTop;
        this.#scrollDOM.addEventListener("scroll", this.#onScroll, { passive: true });
      }

      update(update: ViewUpdate) {
        if (!update.docChanged) return;

        const hasExternal = update.transactions.some((tr) => tr.annotation(ExternalChange));
        if (!hasExternal) return;

        // Capture scrollTop now — update() runs before the DOM is synced,
        // so #scrollTop still holds the pre-change value.
        // Store in ref for React-level restoration after all dispatches.
        savedScrollTopRef.current = this.#scrollTop;
      }

      destroy() {
        this.#scrollDOM.removeEventListener("scroll", this.#onScroll);
      }
    },
  );
}
