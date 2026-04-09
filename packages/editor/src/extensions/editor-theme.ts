import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { EDITOR_COLORS, UI_COLORS } from "@klipperforge/theme";
import { tags } from "@lezer/highlight";

const editorColors = EditorView.theme(
  {
    "&": {
      backgroundColor: EDITOR_COLORS.background,
      color: EDITOR_COLORS.foreground,
    },
    ".cm-content": {
      caretColor: EDITOR_COLORS.cursor,
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: EDITOR_COLORS.cursor,
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: EDITOR_COLORS.selection,
    },
    ".cm-panels": {
      backgroundColor: EDITOR_COLORS.background,
      color: EDITOR_COLORS.foreground,
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: `1px solid ${EDITOR_COLORS.selection}`,
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: `1px solid ${EDITOR_COLORS.selection}`,
    },
    ".cm-searchMatch": {
      backgroundColor: `${EDITOR_COLORS.cursor}33`,
      outline: `1px solid ${EDITOR_COLORS.cursor}66`,
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: `${EDITOR_COLORS.cursor}55`,
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
      backgroundColor: EDITOR_COLORS.gutter,
      color: EDITOR_COLORS.gutterForeground,
      borderRight: `1px solid ${EDITOR_COLORS.gutterBorder}`,
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#ffffff08",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: UI_COLORS.muted,
      color: UI_COLORS.mutedForeground,
      border: "none",
    },
    ".cm-tooltip": {
      backgroundColor: EDITOR_COLORS.background,
      border: `1px solid ${EDITOR_COLORS.selection}`,
      color: EDITOR_COLORS.foreground,
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: EDITOR_COLORS.selection,
      borderBottomColor: EDITOR_COLORS.selection,
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: EDITOR_COLORS.background,
      borderBottomColor: EDITOR_COLORS.background,
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: EDITOR_COLORS.selection,
        color: EDITOR_COLORS.foreground,
      },
    },
  },
  { dark: true },
);

const editorHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: EDITOR_COLORS.keyword },
    { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: EDITOR_COLORS.foreground },
    { tag: [tags.function(tags.variableName), tags.labelName], color: EDITOR_COLORS.function },
    { tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: EDITOR_COLORS.number },
    { tag: [tags.definition(tags.name), tags.separator], color: EDITOR_COLORS.foreground },
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
      color: EDITOR_COLORS.number,
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
      color: EDITOR_COLORS.operator,
    },
    { tag: [tags.meta, tags.comment], color: EDITOR_COLORS.comment },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: EDITOR_COLORS.operator, textDecoration: "underline" },
    { tag: tags.heading, fontWeight: "bold", color: EDITOR_COLORS.heading },
    { tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: EDITOR_COLORS.number },
    { tag: [tags.processingInstruction, tags.string, tags.inserted], color: EDITOR_COLORS.string },
    { tag: tags.invalid, color: EDITOR_COLORS.invalid },
  ]),
);

export const editorTheme: Extension = [editorColors, editorHighlighting];
