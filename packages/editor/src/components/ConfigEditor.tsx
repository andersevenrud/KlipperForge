import { EditorView, type ViewUpdate } from "@codemirror/view";
import type { ConfigSourceMap, OverrideMap, SectionValidationError } from "@klipperforge/klipper-config";
import CodeMirror, { ExternalChange } from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useEditorScroll } from "../context/editor-scroll-context";
import { createClipboardExtension } from "../extensions/clipboard-extension";
import { defaultMatchExtension, dispatchDefaultMatches } from "../extensions/default-match-extension";
import { diffExtension, dispatchDiffLines } from "../extensions/diff-extension";
import { editorTheme } from "../extensions/editor-theme";
import { dispatchFieldHints, type FieldHint, fieldHintExtension } from "../extensions/field-hint-extension";
import { flashLineExtension } from "../extensions/flash-line-extension";
import { createFoldPersistExtension, klipperFoldService, reapplyFolds } from "../extensions/fold-extension";
import { createInlineEditExtension, type InlineEditRequest } from "../extensions/inline-edit-extension";
import { klipperLanguage } from "../extensions/klipper-language";
import { dispatchOverrides, overrideExtension } from "../extensions/override-extension";
import { createScrollPreserveExtension } from "../extensions/scroll-preserve-extension";
import { dispatchUnmanagedSections, unmanagedExtension } from "../extensions/unmanaged-extension";
import { dispatchDiagnostics, validationExtension } from "../extensions/validation-extension";
import { ValidationStatusPopup } from "./ValidationStatusPopup";

export interface ConfigEditorProps {
  value: string;
  validationErrors: SectionValidationError[];
  sourceMap: ConfigSourceMap;
  overrideMap: OverrideMap;
  fieldHints?: FieldHint[];
  diffLines?: number[];
  onValueEdit?: (edit: InlineEditRequest) => void;
  onSectionsCut?: (headers: string[]) => void;
  onSectionsPaste?: (text: string, afterHeader?: string) => void;
  onNavigateToError?: (error: SectionValidationError) => void;
}

export function ConfigEditor({
  value,
  validationErrors,
  sourceMap,
  overrideMap,
  fieldHints,
  diffLines,
  onValueEdit,
  onSectionsCut,
  onSectionsPaste,
  onNavigateToError,
}: ConfigEditorProps) {
  const {
    editorViewRef,
    pendingScrollFieldRef,
    pendingScrollSectionRef,
    pendingScrollToTopRef,
    scrollToField,
    scrollToSection,
    expandAndScrollToSection,
    formScrollTarget,
  } = useEditorScroll();
  const localViewRef = useRef<EditorView | null>(null);
  const lastScrolledTarget = useRef<string | null>(null);
  const savedScrollTopRef = useRef<number | null>(null);
  const foldedSectionsRef = useRef<Set<string>>(new Set());
  const cleanupRef = useRef<(() => void) | null>(null);

  const onCreateEditor = useCallback(
    (view: EditorView) => {
      editorViewRef.current = view;
      localViewRef.current = view;
      try {
        dispatchDiagnostics(view, validationErrors, sourceMap);
        dispatchOverrides(view, overrideMap, sourceMap);
        dispatchFieldHints(view, fieldHints ?? [], sourceMap);
        dispatchDefaultMatches(view, validationErrors, sourceMap);
        dispatchUnmanagedSections(view, sourceMap);
        dispatchDiffLines(view, diffLines ?? []);
      } catch {
        // View may be in a transient state during tab switches
      }
    },
    [editorViewRef, validationErrors, overrideMap, fieldHints, sourceMap, diffLines],
  );

  // Build inverse source map: line number → { header, field? }
  const inverseMap = useMemo(() => {
    const map = new Map<number, { header: string; field?: string }>();
    for (const [header, line] of sourceMap.sectionLines) {
      map.set(line, { header });
    }
    for (const [key, line] of sourceMap.fieldLines) {
      const [header, field] = key.split("::");
      map.set(line, { header, field });
    }
    return map;
  }, [sourceMap]);

  // Use a ref so cursorListener doesn't change when sourceMap changes,
  // preventing @uiw/react-codemirror from reconfiguring extensions
  // (which causes a scroll-resetting measure cycle before the value update).
  const inverseMapRef = useRef(inverseMap);
  inverseMapRef.current = inverseMap;

  const onValueEditRef = useRef<((edit: InlineEditRequest) => void) | null>(onValueEdit ?? null);
  onValueEditRef.current = onValueEdit ?? null;

  const onSectionsCutRef = useRef<((headers: string[]) => void) | null>(onSectionsCut ?? null);
  onSectionsCutRef.current = onSectionsCut ?? null;

  const onSectionsPasteRef = useRef<((text: string, afterHeader?: string) => void) | null>(onSectionsPaste ?? null);
  onSectionsPasteRef.current = onSectionsPaste ?? null;

  const rawSectionLines = useMemo(() => new Set(sourceMap.rawSectionLines), [sourceMap]);
  const rawSectionLinesRef = useRef(rawSectionLines);
  rawSectionLinesRef.current = rawSectionLines;

  const overriddenKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const [header, fieldMap] of overrideMap) {
      for (const field of fieldMap.keys()) {
        keys.add(`${header}::${field}`);
      }
    }
    return keys;
  }, [overrideMap]);
  const overriddenKeysRef = useRef(overriddenKeys);
  overriddenKeysRef.current = overriddenKeys;

  const inlineEditExtension = useMemo(
    () => createInlineEditExtension(onValueEditRef, inverseMapRef, rawSectionLinesRef, overriddenKeysRef),
    [],
  );

  const clipboardExtension = useMemo(
    () => createClipboardExtension(onSectionsCutRef, onSectionsPasteRef, inverseMapRef),
    [],
  );

  // Find which section/field the cursor is on by walking backwards from cursor line
  const cursorListener = useMemo(
    () =>
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (!update.selectionSet) return;
        if (update.transactions.some((tr) => tr.annotation(ExternalChange))) return;
        const pos = update.state.selection.main.head;
        const lineNum = update.state.doc.lineAt(pos).number;

        const currentInverseMap = inverseMapRef.current;

        // Walk backwards from cursor to find nearest section/field mapping
        let target: { header: string; field?: string } | undefined;
        for (let i = lineNum; i >= 1; i--) {
          const entry = currentInverseMap.get(i);
          if (entry) {
            target = entry;
            break;
          }
          // Stop at unmanaged section boundaries (raw sections, macros)
          const lineText = update.state.doc.line(i).text.trimStart();
          if (lineText.startsWith("[") && lineText.includes("]")) {
            break;
          }
        }

        const targetKey = target ? `${target.header}::${target.field ?? ""}` : null;
        if (target && targetKey !== lastScrolledTarget.current) {
          lastScrolledTarget.current = targetKey;
          expandAndScrollToSection(target.header, target.field);
        }
      }),
    [expandAndScrollToSection],
  );

  // Reset dedup guard after the form processes the scroll target,
  // so clicking the same field again will re-trigger the blink
  useEffect(
    function resetDedupGuardEffect() {
      if (!formScrollTarget) {
        lastScrolledTarget.current = null;
      }
    },
    [formScrollTarget],
  );

  const scrollPreserver = useMemo(() => createScrollPreserveExtension(savedScrollTopRef), []);
  const foldPersister = useMemo(() => createFoldPersistExtension(foldedSectionsRef), []);

  const extensions = useMemo(
    () => [
      klipperLanguage,
      klipperFoldService,
      diffExtension,
      flashLineExtension,
      validationExtension,
      overrideExtension,
      fieldHintExtension,
      defaultMatchExtension,
      unmanagedExtension,
      inlineEditExtension,
      clipboardExtension,
      cursorListener,
      scrollPreserver,
      foldPersister,
    ],
    [inlineEditExtension, clipboardExtension, cursorListener, scrollPreserver, foldPersister],
  );

  useEffect(
    function syncDiffLinesEffect() {
      const view = localViewRef.current;
      if (view) {
        try {
          dispatchDiffLines(view, diffLines ?? []);
        } catch {
          // View may be in a transient state during tab switches
        }
      }
    },
    [diffLines],
  );

  useEffect(
    function syncDiagnosticsEffect() {
      const view = localViewRef.current;
      if (view && view.state.doc.length > 0 && view.state.doc.toString() === value) {
        try {
          dispatchDiagnostics(view, validationErrors, sourceMap);
          dispatchOverrides(view, overrideMap, sourceMap);
          dispatchFieldHints(view, fieldHints ?? [], sourceMap);
          dispatchDefaultMatches(view, validationErrors, sourceMap);
          dispatchUnmanagedSections(view, sourceMap);
          reapplyFolds(view, foldedSectionsRef.current);
        } catch {
          // View may be in a transient state during tab switches
        }
      }

      // After doc changes, determine scroll behavior:
      // 1. scrollToTop flag — scroll to line 0 (new file loaded)
      // 2. pendingField — re-scroll to focused field in updated doc
      // 3. pendingSection — re-scroll to section header (e.g. after file tab switch)
      // 4. savedTop — fall back to restoring pixel position
      // Flags are cleared inside the rAF callback, not here, because
      // the effect may re-fire (cancelling previous rAFs via cleanup).
      const scrollToTopRequested = pendingScrollToTopRef.current;
      const pendingField = pendingScrollFieldRef.current;
      const pendingSection = pendingScrollSectionRef.current;
      const savedTop = savedScrollTopRef.current;
      if (scrollToTopRequested && view) {
        savedScrollTopRef.current = null;
        const scrollDOM = view.scrollDOM;
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            pendingScrollToTopRef.current = false;
            pendingScrollFieldRef.current = null;
            pendingScrollSectionRef.current = null;
            scrollDOM.scrollTop = 0;
          });
          cleanupRef.current = () => cancelAnimationFrame(raf2);
        });
        cleanupRef.current = () => cancelAnimationFrame(raf1);
      } else if (pendingField && view) {
        savedScrollTopRef.current = null;
        const { header, field } = pendingField;
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            pendingScrollFieldRef.current = null;
            pendingScrollSectionRef.current = null;
            scrollToField(header, field);
          });
          cleanupRef.current = () => cancelAnimationFrame(raf2);
        });
        cleanupRef.current = () => cancelAnimationFrame(raf1);
      } else if (pendingSection && view) {
        savedScrollTopRef.current = null;
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            pendingScrollSectionRef.current = null;
            scrollToSection(pendingSection);
          });
          cleanupRef.current = () => cancelAnimationFrame(raf2);
        });
        cleanupRef.current = () => cancelAnimationFrame(raf1);
      } else if (savedTop !== null && view) {
        savedScrollTopRef.current = null;
        const scrollDOM = view.scrollDOM;
        const raf1 = requestAnimationFrame(() => {
          const raf2 = requestAnimationFrame(() => {
            scrollDOM.scrollTop = savedTop;
          });
          cleanupRef.current = () => cancelAnimationFrame(raf2);
        });
        cleanupRef.current = () => cancelAnimationFrame(raf1);
      }

      return () => {
        cleanupRef.current?.();
        cleanupRef.current = null;
      };
    },
    [
      validationErrors,
      overrideMap,
      fieldHints,
      sourceMap,
      value,
      pendingScrollFieldRef,
      pendingScrollSectionRef,
      pendingScrollToTopRef,
      scrollToField,
      scrollToSection,
    ],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          height="100%"
          theme={editorTheme}
          extensions={extensions}
          editable={false}
          onCreateEditor={onCreateEditor}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: false,
          }}
          className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto [&_.cm-content]:cursor-default [&_.cm-scroller]:cursor-default"
        />
        <ValidationStatusPopup errors={validationErrors} onNavigateToError={onNavigateToError} />
      </div>
    </div>
  );
}
