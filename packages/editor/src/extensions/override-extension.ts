import { type Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import type { ActiveOverride, ConfigSourceMap, OverrideMap } from "@klipperforge/klipper-config";

interface OverrideEntry {
  line: number;
  field: string;
  override: ActiveOverride;
}

class OverrideWidget extends WidgetType {
  constructor(
    readonly field: string,
    readonly override: ActiveOverride,
  ) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-override-badge";
    span.textContent = `← overridden by [${this.override.sourceHeader}]`;
    span.title = `Original: ${this.override.originalValue !== undefined ? String(this.override.originalValue) : "(not set)"}\nOutput: ${String(this.override.overriddenValue)}`;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

const setOverrides = StateEffect.define<OverrideEntry[]>();

const overrideLineMark = Decoration.line({ class: "cm-override-line" });

const overrideField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setOverrides)) {
        const builder = new RangeSetBuilder<Decoration>();
        const sorted = [...effect.value].sort((a, b) => a.line - b.line);
        for (const entry of sorted) {
          if (entry.line < 1 || entry.line > tr.state.doc.lines) continue;
          const line = tr.state.doc.line(entry.line);
          builder.add(line.from, line.from, overrideLineMark);
          builder.add(
            line.to,
            line.to,
            Decoration.widget({
              widget: new OverrideWidget(entry.field, entry.override),
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

const overrideTheme = EditorView.baseTheme({
  ".cm-override-line": {
    backgroundColor: "rgb(59 130 246 / 0.08)",
  },
  ".cm-override-badge": {
    marginLeft: "1em",
    fontSize: "0.75em",
    color: "rgb(96 165 250)",
    opacity: "0.8",
    fontStyle: "italic",
  },
});

export const overrideExtension: Extension = [overrideField, overrideTheme];

export function dispatchOverrides(view: EditorView, overrideMap: OverrideMap, sourceMap: ConfigSourceMap): void {
  const entries: OverrideEntry[] = [];

  for (const [header, fieldMap] of overrideMap) {
    for (const [field, override] of fieldMap) {
      const lineNum = sourceMap.fieldLines.get(`${header}::${field}`);
      if (lineNum !== undefined) {
        entries.push({ line: lineNum, field, override });
      }
    }
  }

  view.dispatch({ effects: setOverrides.of(entries) });
}
