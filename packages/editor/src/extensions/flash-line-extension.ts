import { type Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";

const flashLineEffect = StateEffect.define<number>();

const flashLineMark = Decoration.line({ class: "cm-flash-line" });

const flashLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(flashLineEffect)) {
        const pos = effect.value;
        if (pos < 0 || pos > tr.state.doc.length) return Decoration.none;
        return Decoration.set([flashLineMark.range(pos)]);
      }
    }
    if (tr.docChanged) {
      return decorations.map(tr.changes);
    }
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const flashLineTheme = EditorView.baseTheme({
  "@keyframes cm-flash-fade": {
    from: { backgroundColor: "rgb(212 17 22 / 0.3)" },
    to: { backgroundColor: "transparent" },
  },
  ".cm-flash-line": {
    animation: "cm-flash-fade 1.5s ease-out forwards",
  },
});

const flashLineExtension: Extension = [flashLineField, flashLineTheme];

export { flashLineEffect, flashLineExtension };
