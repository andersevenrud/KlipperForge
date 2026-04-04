import { lintGutter, setDiagnostics } from "@codemirror/lint";
import type { Diagnostic } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { ConfigSourceMap, SectionValidationError } from "@klipperforge/klipper-config";

function mapErrorsToDiagnostics(
  view: EditorView,
  errors: SectionValidationError[],
  sourceMap: ConfigSourceMap,
): Diagnostic[] {
  const doc = view.state.doc;
  const diagnostics: Diagnostic[] = [];

  for (const error of errors) {
    // Skip info diagnostics — omitted fields aren't in the output
    if (error.severity === "info") continue;

    let lineNum: number | undefined;

    if (error.field) {
      lineNum = sourceMap.fieldLines.get(`${error.section}::${error.field}`);
    }
    if (lineNum === undefined) {
      lineNum = sourceMap.sectionLines.get(error.section);
    }
    if (lineNum === undefined) {
      lineNum = 1;
    }

    if (lineNum < 1 || lineNum > doc.lines) continue;

    const line = doc.line(lineNum);

    diagnostics.push({
      from: line.from,
      to: line.to,
      severity: error.severity ?? "error",
      message: error.field ? `${error.field}: ${error.message}` : error.message,
    });
  }

  return diagnostics;
}

export function dispatchDiagnostics(
  view: EditorView,
  errors: SectionValidationError[],
  sourceMap: ConfigSourceMap,
): void {
  const diagnostics = mapErrorsToDiagnostics(view, errors, sourceMap);
  view.dispatch(setDiagnostics(view.state, diagnostics));
}

const validationTheme = EditorView.baseTheme({
  ".cm-diagnostic-error": {
    borderBottom: "2px wavy #ef4444",
  },
  ".cm-diagnostic-warning": {
    borderBottom: "2px wavy #f59e0b",
  },
  ".cm-diagnostic-info": {
    borderBottom: "2px wavy #3b82f6",
  },
  ".cm-tooltip-lint": {
    backgroundColor: "#1e1e1e",
    border: "1px solid #333333",
    color: "#e0e0e0",
  },
  ".cm-lint-marker-error": {
    content: "'!'",
  },
  ".cm-lint-marker-warning": {
    content: "'!'",
  },
});

export const validationExtension: Extension = [lintGutter(), validationTheme];
