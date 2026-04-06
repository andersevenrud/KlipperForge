import { type Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import type { ConfigSourceMap, SectionValidationError } from "@klipperforge/klipper-config";

interface DefaultMatchEntry {
  line: number;
  field: string;
  message: string;
}

class DefaultMatchWidget extends WidgetType {
  constructor(readonly message: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-default-match-badge";
    span.textContent = `← ${this.message.toLowerCase()}`;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

const setDefaultMatches = StateEffect.define<DefaultMatchEntry[]>();

const defaultMatchField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDefaultMatches)) {
        const builder = new RangeSetBuilder<Decoration>();
        const sorted = [...effect.value].sort((a, b) => a.line - b.line);
        for (const entry of sorted) {
          if (entry.line < 1 || entry.line > tr.state.doc.lines) continue;
          const line = tr.state.doc.line(entry.line);
          builder.add(
            line.to,
            line.to,
            Decoration.widget({
              widget: new DefaultMatchWidget(entry.message),
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

const defaultMatchTheme = EditorView.baseTheme({
  ".cm-default-match-badge": {
    marginLeft: "1em",
    fontSize: "0.75em",
    color: "rgb(156 163 175)",
    opacity: "0.8",
    fontStyle: "italic",
  },
});

export const defaultMatchExtension: Extension = [defaultMatchField, defaultMatchTheme];

export function dispatchDefaultMatches(
  view: EditorView,
  errors: SectionValidationError[],
  sourceMap: ConfigSourceMap,
): void {
  const entries: DefaultMatchEntry[] = [];

  for (const error of errors) {
    if (error.severity !== "info" || !error.field) continue;
    const lineNum = sourceMap.fieldLines.get(`${error.section}::${error.field}`);
    if (lineNum === undefined) continue;
    entries.push({ line: lineNum, field: error.field, message: error.message });
  }

  view.dispatch({ effects: setDefaultMatches.of(entries) });
}
