import { type Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import type { ConfigSourceMap } from "@klipperforge/klipper-config";

class UnmanagedWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-unmanaged-badge";
    span.textContent = "\u2190 unmanaged section";
    span.title = "This section is not managed by KlipperForge and is passed through as-is";
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

const setUnmanagedLines = StateEffect.define<number[]>();

const unmanagedLineMark = Decoration.line({ class: "cm-unmanaged-line" });

const unmanagedField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setUnmanagedLines)) {
        const builder = new RangeSetBuilder<Decoration>();
        const sorted = [...effect.value].sort((a, b) => a - b);
        for (const lineNum of sorted) {
          if (lineNum < 1 || lineNum > tr.state.doc.lines) continue;
          const line = tr.state.doc.line(lineNum);
          builder.add(line.from, line.from, unmanagedLineMark);
          builder.add(
            line.to,
            line.to,
            Decoration.widget({
              widget: new UnmanagedWidget(),
              side: 1,
            }),
          );
        }
        return builder.finish();
      }
    }
    if (tr.docChanged) {
      return decorations.map(tr.changes);
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const unmanagedTheme = EditorView.baseTheme({
  ".cm-unmanaged-line": {
    backgroundColor: "rgb(59 130 246 / 0.08)",
  },
  ".cm-unmanaged-badge": {
    marginLeft: "1em",
    fontSize: "0.75em",
    color: "rgb(96 165 250)",
    opacity: "0.8",
    fontStyle: "italic",
  },
});

export const unmanagedExtension: Extension = [unmanagedField, unmanagedTheme];

export function dispatchUnmanagedSections(view: EditorView, sourceMap: ConfigSourceMap): void {
  view.dispatch({ effects: setUnmanagedLines.of(sourceMap.rawSectionLines) });
}
