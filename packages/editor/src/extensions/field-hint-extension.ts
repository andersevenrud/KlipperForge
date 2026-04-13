import { type Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import type { ConfigSourceMap } from "@klipperforge/klipper-config";

export interface FieldHint {
  header: string;
  field: string;
  text: string;
}

interface FieldHintEntry {
  line: number;
  text: string;
}

class FieldHintWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-field-hint-badge";
    span.textContent = `← ${this.text}`;
    return span;
  }

  eq(other: FieldHintWidget) {
    return other.text === this.text;
  }

  ignoreEvent() {
    return true;
  }
}

const setFieldHints = StateEffect.define<FieldHintEntry[]>();

const fieldHintField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setFieldHints)) {
        const builder = new RangeSetBuilder<Decoration>();
        const sorted = [...effect.value].sort((a, b) => a.line - b.line);
        for (const entry of sorted) {
          if (entry.line < 1 || entry.line > tr.state.doc.lines) continue;
          const line = tr.state.doc.line(entry.line);
          builder.add(
            line.to,
            line.to,
            Decoration.widget({
              widget: new FieldHintWidget(entry.text),
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

const fieldHintTheme = EditorView.baseTheme({
  ".cm-field-hint-badge": {
    marginLeft: "1em",
    fontSize: "0.75em",
    color: "rgb(96 165 250)",
    opacity: "0.8",
    fontStyle: "italic",
  },
});

export const fieldHintExtension: Extension = [fieldHintField, fieldHintTheme];

export function dispatchFieldHints(view: EditorView, hints: FieldHint[], sourceMap: ConfigSourceMap): void {
  const entries: FieldHintEntry[] = [];
  for (const hint of hints) {
    const line = sourceMap.fieldLines.get(`${hint.header}::${hint.field}`);
    if (line !== undefined) {
      entries.push({ line, text: hint.text });
    }
  }
  view.dispatch({ effects: setFieldHints.of(entries) });
}
