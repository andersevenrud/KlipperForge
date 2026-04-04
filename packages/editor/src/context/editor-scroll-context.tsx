import type { StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { SAVE_CONFIG_HEADER_PREFIX } from "@klipperforge/klipper-config";
import { type MutableRefObject, type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";
import { flashLineEffect } from "../extensions/flash-line-extension";
import { unfoldAtPosition } from "../extensions/fold-extension";

interface FormScrollTarget {
  header: string;
  field?: string;
}

interface PendingScrollField {
  header: string;
  field: string;
}

interface EditorScrollContextValue {
  editorViewRef: MutableRefObject<EditorView | null>;
  pendingScrollFieldRef: MutableRefObject<PendingScrollField | null>;
  pendingScrollSectionRef: MutableRefObject<string | null>;
  pendingScrollToTopRef: MutableRefObject<boolean>;
  scrollToTop: () => void;
  scrollToSection: (header: string, lineNumber?: number) => void;
  scrollToField: (header: string, field: string) => void;
  formScrollTarget: FormScrollTarget | null;
  expandAndScrollToSection: (header: string, field?: string) => void;
  clearFormScrollTarget: () => void;
}

const EditorScrollContext = createContext<EditorScrollContextValue | null>(null);

export function EditorScrollProvider({ children }: { children: ReactNode }) {
  const editorViewRef = useRef<EditorView | null>(null);
  const pendingScrollFieldRef = useRef<PendingScrollField | null>(null);
  const pendingScrollSectionRef = useRef<string | null>(null);
  const pendingScrollToTopRef = useRef(false);
  const [formScrollTarget, setFormScrollTarget] = useState<FormScrollTarget | null>(null);

  const scrollToTop = useCallback(() => {
    pendingScrollToTopRef.current = true;
    pendingScrollFieldRef.current = null;
  }, []);

  const scrollToSection = useCallback((header: string, lineNumber?: number) => {
    pendingScrollSectionRef.current = header;
    const view = editorViewRef.current;
    if (!view) return;

    const doc = view.state.doc;

    // Direct line number jump (used for comment sections)
    if (lineNumber && lineNumber >= 1 && lineNumber <= doc.lines) {
      const line = doc.line(lineNumber);
      const effects: StateEffect<unknown>[] = [
        flashLineEffect.of(line.from),
        EditorView.scrollIntoView(line.from, { y: "start", yMargin: 50 }),
      ];
      const unfold = unfoldAtPosition(view.state, line.from);
      if (unfold) effects.push(unfold);
      view.dispatch({ effects });
      return;
    }

    // Text-based search for [section] headers
    const isSaveConfig = header.startsWith(SAVE_CONFIG_HEADER_PREFIX);
    const target = isSaveConfig
      ? `${SAVE_CONFIG_HEADER_PREFIX}[${header.slice(SAVE_CONFIG_HEADER_PREFIX.length)}]`
      : `[${header}]`;

    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      if (line.text.trim() === target) {
        const effects: StateEffect<unknown>[] = [
          flashLineEffect.of(line.from),
          EditorView.scrollIntoView(line.from, { y: "start", yMargin: 50 }),
        ];
        const unfold = unfoldAtPosition(view.state, line.from);
        if (unfold) effects.push(unfold);
        view.dispatch({ effects });
        return;
      }
    }
  }, []);

  const scrollToField = useCallback((header: string, field: string) => {
    pendingScrollFieldRef.current = { header, field };

    const view = editorViewRef.current;
    if (!view) return;

    const doc = view.state.doc;
    const sectionTarget = `[${header}]`;
    let inSection = false;

    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const trimmed = line.text.trim();

      if (trimmed.startsWith("[") && trimmed.includes("]")) {
        if (inSection) return;
        if (trimmed === sectionTarget || trimmed.startsWith(`${sectionTarget} `)) {
          inSection = true;
        }
        continue;
      }

      if (inSection && (trimmed.startsWith(`${field}:`) || trimmed.startsWith(`${field}=`))) {
        const effects: StateEffect<unknown>[] = [
          flashLineEffect.of(line.from),
          EditorView.scrollIntoView(line.from, { y: "center", yMargin: 50 }),
        ];
        const unfold = unfoldAtPosition(view.state, line.from);
        if (unfold) effects.push(unfold);
        view.dispatch({ effects });
        return;
      }
    }
  }, []);

  const expandAndScrollToSection = useCallback((header: string, field?: string) => {
    setFormScrollTarget({ header, field });
  }, []);

  const clearFormScrollTarget = useCallback(() => {
    setFormScrollTarget(null);
  }, []);

  return (
    <EditorScrollContext.Provider
      value={{
        editorViewRef,
        pendingScrollFieldRef,
        pendingScrollSectionRef,
        pendingScrollToTopRef,
        scrollToTop,
        scrollToSection,
        scrollToField,
        formScrollTarget,
        expandAndScrollToSection,
        clearFormScrollTarget,
      }}
    >
      {children}
    </EditorScrollContext.Provider>
  );
}

export function useEditorScroll() {
  const context = useContext(EditorScrollContext);
  if (!context) {
    throw new Error("useEditorScroll must be used within an EditorScrollProvider");
  }
  return context;
}
