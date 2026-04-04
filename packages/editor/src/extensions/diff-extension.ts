import { type Extension, RangeSetBuilder, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";

const setDiffLines = StateEffect.define<number[]>();

const diffLineMark = Decoration.line({ class: "cm-diff-line" });

const diffField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiffLines)) {
        const builder = new RangeSetBuilder<Decoration>();
        for (const lineNum of effect.value) {
          if (lineNum < 1 || lineNum > tr.state.doc.lines) continue;
          const line = tr.state.doc.line(lineNum);
          builder.add(line.from, line.from, diffLineMark);
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

const diffTheme = EditorView.theme({
  ".cm-diff-line": {
    backgroundImage: "linear-gradient(rgb(34 197 94 / 0.1), rgb(34 197 94 / 0.1))",
  },
});

export const diffExtension: Extension = [diffField, diffTheme];

export function dispatchDiffLines(view: EditorView, lines: number[]): void {
  view.dispatch({ effects: setDiffLines.of(lines) });
}
