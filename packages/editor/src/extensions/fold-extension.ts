import { foldEffect, foldService, foldable, foldedRanges, unfoldEffect } from "@codemirror/language";
import type { EditorState, StateEffect } from "@codemirror/state";
import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { ExternalChange } from "@uiw/react-codemirror";
import type { MutableRefObject } from "react";

interface FoldRange {
  from: number;
  to: number;
}

const SECTION_HEADER_RE = /^\[.+\]/;

/**
 * Fold service for Klipper INI-style config sections.
 * Folds from the end of a `[section]` header line to the last
 * non-blank line before the next header or end of document.
 */
export const klipperFoldService = foldService.of((state: EditorState, lineStart: number, lineEnd: number) => {
  const headerLine = state.doc.lineAt(lineStart);
  if (!SECTION_HEADER_RE.test(headerLine.text.trim())) return null;

  const doc = state.doc;
  let lastContentLine = headerLine.number;

  for (let i = headerLine.number + 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const trimmed = line.text.trim();
    if (SECTION_HEADER_RE.test(trimmed)) break;
    if (trimmed.length > 0) {
      lastContentLine = i;
    }
  }

  if (lastContentLine === headerLine.number) return null;

  return { from: lineEnd, to: doc.line(lastContentLine).to };
});

function parseSectionName(lineText: string): string | null {
  const trimmed = lineText.trim();
  const match = trimmed.match(/^\[(.+)\]$/);
  return match ? match[1] : null;
}

/**
 * ViewPlugin that captures folded section names before an external
 * doc replacement clears the fold state. Stores names in a React ref
 * so they can be reapplied after the new doc is dispatched.
 */
export function createFoldPersistExtension(foldedSectionsRef: MutableRefObject<Set<string>>) {
  return ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate) {
        if (!update.docChanged) return;

        const hasExternal = update.transactions.some((tr) => tr.annotation(ExternalChange));
        if (!hasExternal) return;

        const oldState = update.startState;
        const folded = foldedRanges(oldState);
        const names = new Set<string>();

        const cursor = folded.iter();
        while (cursor.value) {
          const line = oldState.doc.lineAt(cursor.from);
          const name = parseSectionName(line.text);
          if (name) {
            names.add(name);
          }
          cursor.next();
        }

        foldedSectionsRef.current = names;
      }
    },
  );
}

/**
 * Reapply folds for the given section names in the current document.
 * Called from syncDiagnosticsEffect after external doc replacement.
 */
export function reapplyFolds(view: EditorView, sectionNames: Set<string>) {
  if (sectionNames.size === 0) return;

  const state = view.state;
  const doc = state.doc;
  const effects: StateEffect<FoldRange>[] = [];

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const name = parseSectionName(line.text);
    if (name && sectionNames.has(name)) {
      const range = foldable(state, line.from, line.to);
      if (range) {
        effects.push(foldEffect.of(range));
      }
    }
  }

  if (effects.length > 0) {
    view.dispatch({ effects });
  }
}

/**
 * Check if a position falls inside a folded range and return the
 * unfold effect if so, or null otherwise.
 */
export function unfoldAtPosition(state: EditorState, pos: number) {
  const folded = foldedRanges(state);
  const cursor = folded.iter();
  while (cursor.value) {
    if (cursor.from <= pos && pos <= cursor.to) {
      return unfoldEffect.of({ from: cursor.from, to: cursor.to });
    }
    cursor.next();
  }
  return null;
}
