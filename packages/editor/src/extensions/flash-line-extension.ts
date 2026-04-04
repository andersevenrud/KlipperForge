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
        return Decoration.set([flashLineMark.range(effect.value)]);
      }
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
