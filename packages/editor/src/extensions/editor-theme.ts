import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

const editorColors = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1e1e1e",
      color: "#e0e0e0",
    },
    ".cm-content": {
      caretColor: "#d41116",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#d41116",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "#333333",
    },
    ".cm-panels": {
      backgroundColor: "#1e1e1e",
      color: "#e0e0e0",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid #333333",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid #333333",
    },
    ".cm-searchMatch": {
      backgroundColor: "#d4111633",
      outline: "1px solid #d4111666",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#d4111655",
    },
    ".cm-activeLine": {
      backgroundColor: "#ffffff08",
    },
    ".cm-selectionMatch": {
      backgroundColor: "#ffffff15",
    },
    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "#ffffff20",
    },
    ".cm-gutters": {
      backgroundColor: "#181818",
      color: "#6b6b6b",
      borderRight: "1px solid #272727",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#ffffff08",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "#272727",
      color: "#9e9e9e",
      border: "none",
    },
    ".cm-tooltip": {
      backgroundColor: "#1e1e1e",
      border: "1px solid #333333",
      color: "#e0e0e0",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "#333333",
      borderBottomColor: "#333333",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "#1e1e1e",
      borderBottomColor: "#1e1e1e",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: "#333333",
        color: "#e0e0e0",
      },
    },
  },
  { dark: true },
);

const editorHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: "#d41116" },
    { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: "#e0e0e0" },
    { tag: [tags.function(tags.variableName), tags.labelName], color: "#82aaff" },
    { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#f5a97f" },
    { tag: [tags.definition(tags.name), tags.separator], color: "#e0e0e0" },
    {
      tag: [
        tags.typeName,
        tags.className,
        tags.number,
        tags.changed,
        tags.annotation,
        tags.modifier,
        tags.self,
        tags.namespace,
      ],
      color: "#f5a97f",
    },
    {
      tag: [
        tags.operator,
        tags.operatorKeyword,
        tags.url,
        tags.escape,
        tags.regexp,
        tags.link,
        tags.special(tags.string),
      ],
      color: "#89dceb",
    },
    { tag: [tags.meta, tags.comment], color: "#6b6b6b" },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "#89dceb", textDecoration: "underline" },
    { tag: tags.heading, fontWeight: "bold", color: "#fab387" },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: "#f5a97f" },
    { tag: [tags.processingInstruction, tags.string, tags.inserted], color: "#a6da95" },
    { tag: tags.invalid, color: "#f56565" },
  ]),
);

export const editorTheme: Extension = [editorColors, editorHighlighting];
