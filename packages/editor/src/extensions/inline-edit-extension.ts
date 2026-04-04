import type { Extension, Text } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

export interface InlineEditRequest {
  header: string;
  field: string;
  newValue: string;
}

interface InverseMapEntry {
  header: string;
  field?: string;
}

interface SingleLineEditState {
  kind: "single";
  input: HTMLInputElement;
  lineNumber: number;
  header: string;
  field: string;
}

interface MultilineEditState {
  kind: "multiline";
  textarea: HTMLTextAreaElement;
  keyLineNumber: number;
  header: string;
  field: string;
}

type InlineEditState = SingleLineEditState | MultilineEditState;

const VALUE_PATTERN = /^([a-zA-Z_]\w*)\s*[:=]\s*/;
const MULTILINE_KEY_PATTERN = /^([a-zA-Z_]\w*)\s*:\s*$/;
const SAVE_CONFIG_PREFIX = "#*# ";

function parseValueRange(lineText: string): { start: number; end: number } | null {
  const match = VALUE_PATTERN.exec(lineText);
  if (!match) return null;

  const valueStart = match[0].length;
  let valueEnd = lineText.length;

  // Strip inline comment (but not inside quoted strings)
  const valueText = lineText.slice(valueStart);
  const commentIdx = valueText.search(/\s+#\s/);
  if (commentIdx >= 0) {
    valueEnd = valueStart + commentIdx;
  }

  // Trim trailing whitespace from value
  const trimmed = lineText.slice(valueStart, valueEnd).trimEnd();
  valueEnd = valueStart + trimmed.length;

  return { start: valueStart, end: valueEnd };
}

function isEditableLine(
  lineText: string,
  lineNumber: number,
  inverseMap: Map<number, InverseMapEntry>,
  _rawSectionLines: Set<number>,
  overriddenKeys: Set<string>,
): { header: string; field: string } | null {
  // Skip empty lines
  if (!lineText.trim()) return null;

  // Skip section headers
  if (lineText.trimStart().startsWith("[")) return null;

  // Skip comment-only lines
  if (lineText.trimStart().startsWith("#")) return null;

  // Skip save_config block lines
  if (lineText.startsWith(SAVE_CONFIG_PREFIX)) return null;

  // Look up in inverse map (raw section fields are not in the inverse map)
  const entry = inverseMap.get(lineNumber);
  if (!entry?.field) return null;

  // Skip overridden fields
  const key = `${entry.header}::${entry.field}`;
  if (overriddenKeys.has(key)) return null;

  // Skip multiline values (lines starting with whitespace that are continuation lines)
  if (lineText.startsWith(" ") || lineText.startsWith("\t")) return null;

  // Must have a parseable value
  if (!parseValueRange(lineText)) return null;

  return { header: entry.header, field: entry.field };
}

function isMultilineEditable(
  doc: Text,
  lineNumber: number,
  lineText: string,
  inverseMap: Map<number, InverseMapEntry>,
  rawSectionLines: Set<number>,
  overriddenKeys: Set<string>,
): { header: string; field: string; keyLineNumber: number } | null {
  // Skip empty, section headers, comments, save_config
  if (!lineText.trim()) return null;
  if (lineText.trimStart().startsWith("[")) return null;
  if (lineText.trimStart().startsWith("#")) return null;
  if (lineText.startsWith(SAVE_CONFIG_PREFIX)) return null;

  let keyLineNumber: number;

  if (lineText.startsWith(" ") || lineText.startsWith("\t")) {
    // Continuation line: walk backwards to find the key line
    keyLineNumber = -1;
    for (let i = lineNumber - 1; i >= 1; i--) {
      const text = doc.line(i).text;
      if (text.startsWith(" ") || text.startsWith("\t")) continue;
      if (text.trim() === "") break;
      if (MULTILINE_KEY_PATTERN.test(text)) {
        keyLineNumber = i;
      }
      break;
    }
    if (keyLineNumber === -1) return null;
  } else if (MULTILINE_KEY_PATTERN.test(lineText)) {
    // Key line with empty value (e.g. "gcode:")
    // Verify there are continuation lines below
    if (lineNumber < doc.lines) {
      const nextLine = doc.line(lineNumber + 1).text;
      if (!nextLine.startsWith(" ") && !nextLine.startsWith("\t")) return null;
    } else {
      return null;
    }
    keyLineNumber = lineNumber;
  } else {
    return null;
  }

  // Look up key line in inverse map
  const entry = inverseMap.get(keyLineNumber);
  if (!entry?.field) return null;

  // Skip raw section lines
  if (rawSectionLines.has(keyLineNumber)) return null;

  // Skip overridden fields
  const key = `${entry.header}::${entry.field}`;
  if (overriddenKeys.has(key)) return null;

  return { header: entry.header, field: entry.field, keyLineNumber };
}

function extractMultilineBlock(doc: Text, keyLineNumber: number): { content: string; endLine: number } {
  const lines: string[] = [];
  let endLine = keyLineNumber;
  for (let i = keyLineNumber + 1; i <= doc.lines; i++) {
    const text = doc.line(i).text;
    if (text.startsWith(" ") || text.startsWith("\t")) {
      // Strip base indentation (4 spaces or 1 tab)
      lines.push(text.replace(/^( {4}|\t)/, ""));
      endLine = i;
    } else {
      break;
    }
  }
  return { content: lines.join("\n"), endLine };
}

export function createInlineEditExtension(
  callbackRef: { current: ((edit: InlineEditRequest) => void) | null },
  inverseMapRef: { current: Map<number, InverseMapEntry> },
  rawSectionLinesRef: { current: Set<number> },
  overriddenKeysRef: { current: Set<string> },
): Extension {
  const inlineEditPlugin = ViewPlugin.fromClass(
    class {
      private state: InlineEditState | null = null;
      view: EditorView;

      constructor(view: EditorView) {
        this.view = view;
      }

      update(update: ViewUpdate) {
        if (!this.state) return;

        // Cancel if document changed externally
        if (update.docChanged) {
          this.cancel();
          return;
        }

        // Reposition if geometry changed (scroll, resize)
        if (update.geometryChanged) {
          this.reposition();
        }
      }

      startEdit(lineNumber: number, header: string, field: string) {
        // Cancel any existing edit
        if (this.state) {
          this.cancel();
        }

        const line = this.view.state.doc.line(lineNumber);
        const lineText = line.text;
        const range = parseValueRange(lineText);
        if (!range) return;

        const currentValue = lineText.slice(range.start, range.end);

        // Get coordinates for positioning
        const startPos = line.from + range.start;
        const endPos = line.from + range.end;
        const startCoords = this.view.coordsAtPos(startPos);
        const endCoords = this.view.coordsAtPos(endPos);
        if (!startCoords || !endCoords) return;

        const editorDOM = this.view.dom;
        const editorRect = editorDOM.getBoundingClientRect();

        const input = document.createElement("input");
        input.className = "cm-inline-edit-input";
        input.value = currentValue;

        // Position the input over the value
        const top = startCoords.top - editorRect.top;
        const left = startCoords.left - editorRect.left;
        const width = Math.max(endCoords.right - startCoords.left, 60);
        const height = startCoords.bottom - startCoords.top;

        input.style.position = "absolute";
        input.style.top = `${top}px`;
        input.style.left = `${left}px`;
        input.style.width = `${width + 40}px`;
        input.style.height = `${height}px`;
        input.style.zIndex = "100";

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            this.cancel();
          }
        });

        input.addEventListener("blur", () => {
          // Delay to allow keydown to fire first
          setTimeout(() => {
            if (this.state?.kind === "single" && this.state.input === input) {
              this.commit();
            }
          }, 0);
        });

        editorDOM.style.position = "relative";
        editorDOM.appendChild(input);
        input.focus();
        input.select();

        this.state = { kind: "single", input, lineNumber, header, field };
      }

      startMultilineEdit(
        keyLineNumber: number,
        endLine: number,
        content: string,
        header: string,
        field: string,
        clickedContentLine: number,
      ) {
        if (this.state) {
          this.cancel();
        }

        const keyLine = this.view.state.doc.line(keyLineNumber);
        const endLineObj = this.view.state.doc.line(endLine);
        const keyCoords = this.view.coordsAtPos(keyLine.from);
        const endCoords = this.view.coordsAtPos(endLineObj.to);
        if (!keyCoords || !endCoords) return;

        const editorDOM = this.view.dom;
        const editorRect = editorDOM.getBoundingClientRect();

        const textarea = document.createElement("textarea");
        textarea.className = "cm-inline-edit-textarea";
        textarea.value = content;

        // Position over the continuation block (below the key line)
        const lineHeight = keyCoords.bottom - keyCoords.top;
        const top = keyCoords.top - editorRect.top + lineHeight;
        const blockHeight = endCoords.bottom - keyCoords.bottom;
        const height = Math.max(blockHeight, 60);

        textarea.style.position = "absolute";
        textarea.style.top = `${top}px`;
        textarea.style.left = "0px";
        textarea.style.width = "100%";
        textarea.style.height = `${height + 20}px`;
        textarea.style.zIndex = "100";

        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            this.cancel();
          } else if (e.key === "Tab") {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = `${textarea.value.substring(0, start)}    ${textarea.value.substring(end)}`;
            textarea.selectionStart = textarea.selectionEnd = start + 4;
          }
        });

        textarea.addEventListener("blur", () => {
          setTimeout(() => {
            if (this.state?.kind === "multiline" && this.state.textarea === textarea) {
              this.commit();
            }
          }, 0);
        });

        editorDOM.style.position = "relative";
        editorDOM.appendChild(textarea);
        textarea.focus();

        // Position cursor at the line that was double-clicked
        if (clickedContentLine >= 0) {
          const lines = content.split("\n");
          let charOffset = 0;
          for (let i = 0; i < clickedContentLine && i < lines.length; i++) {
            charOffset += lines[i].length + 1;
          }
          textarea.selectionStart = textarea.selectionEnd = charOffset;
        }

        this.state = { kind: "multiline", textarea, keyLineNumber, header, field };
      }

      private reposition() {
        if (!this.state) return;

        if (this.state.kind === "single") {
          const { lineNumber } = this.state;
          if (lineNumber < 1 || lineNumber > this.view.state.doc.lines) {
            this.cancel();
            return;
          }

          const line = this.view.state.doc.line(lineNumber);
          const range = parseValueRange(line.text);
          if (!range) {
            this.cancel();
            return;
          }

          const startPos = line.from + range.start;
          const startCoords = this.view.coordsAtPos(startPos);
          if (!startCoords) {
            this.cancel();
            return;
          }

          const editorRect = this.view.dom.getBoundingClientRect();
          const top = startCoords.top - editorRect.top;
          const left = startCoords.left - editorRect.left;

          // Cancel if scrolled off-screen
          if (top < 0 || top > editorRect.height) {
            this.cancel();
            return;
          }

          this.state.input.style.top = `${top}px`;
          this.state.input.style.left = `${left}px`;
        } else {
          const { keyLineNumber } = this.state;
          if (keyLineNumber < 1 || keyLineNumber > this.view.state.doc.lines) {
            this.cancel();
            return;
          }

          const keyLine = this.view.state.doc.line(keyLineNumber);
          const keyCoords = this.view.coordsAtPos(keyLine.from);
          if (!keyCoords) {
            this.cancel();
            return;
          }

          const editorRect = this.view.dom.getBoundingClientRect();
          const lineHeight = keyCoords.bottom - keyCoords.top;
          const top = keyCoords.top - editorRect.top + lineHeight;

          if (top < 0 || top > editorRect.height) {
            this.cancel();
            return;
          }

          this.state.textarea.style.top = `${top}px`;
        }
      }

      private commit() {
        if (!this.state) return;

        const { header, field } = this.state;
        const newValue = this.state.kind === "single" ? this.state.input.value : this.state.textarea.value;
        this.removeOverlay();

        callbackRef.current?.({ header, field, newValue });
      }

      private cancel() {
        this.removeOverlay();
        this.view.focus();
      }

      private removeOverlay() {
        if (!this.state) return;
        if (this.state.kind === "single") {
          this.state.input.remove();
        } else {
          this.state.textarea.remove();
        }
        this.state = null;
      }

      destroy() {
        this.removeOverlay();
      }

      handleDblClick(view: EditorView, event: MouseEvent): boolean {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos === null) return false;

        const line = view.state.doc.lineAt(pos);
        const lineNumber = line.number;
        const lineText = line.text;

        // Try single-line edit first
        const editable = isEditableLine(
          lineText,
          lineNumber,
          inverseMapRef.current,
          rawSectionLinesRef.current,
          overriddenKeysRef.current,
        );

        if (editable) {
          const range = parseValueRange(lineText);
          if (!range) return false;

          const clickOffset = pos - line.from;
          if (clickOffset < range.start) return false;

          event.preventDefault();
          this.startEdit(lineNumber, editable.header, editable.field);
          return true;
        }

        // Try multiline edit
        const multiline = isMultilineEditable(
          view.state.doc,
          lineNumber,
          lineText,
          inverseMapRef.current,
          rawSectionLinesRef.current,
          overriddenKeysRef.current,
        );

        if (multiline) {
          event.preventDefault();
          const { content, endLine } = extractMultilineBlock(view.state.doc, multiline.keyLineNumber);
          const clickedContentLine = lineNumber - multiline.keyLineNumber - 1;
          this.startMultilineEdit(
            multiline.keyLineNumber,
            endLine,
            content,
            multiline.header,
            multiline.field,
            clickedContentLine,
          );
          return true;
        }

        return false;
      }
    },
    {
      eventHandlers: {
        dblclick(event: MouseEvent) {
          return this.handleDblClick(this.view, event);
        },
      },
    },
  );

  const inlineEditTheme = EditorView.baseTheme({
    ".cm-inline-edit-input": {
      fontFamily: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      padding: "0 2px",
      margin: "0",
      border: "1px solid rgb(99 102 241)",
      borderRadius: "2px",
      backgroundColor: "#2d2d2d",
      color: "#e0e0e0",
      outline: "none",
      boxSizing: "border-box",
    },
    ".cm-inline-edit-textarea": {
      fontFamily: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      padding: "4px 6px",
      margin: "0",
      border: "1px solid rgb(99 102 241)",
      borderRadius: "4px",
      backgroundColor: "#2d2d2d",
      color: "#e0e0e0",
      outline: "none",
      boxSizing: "border-box",
      resize: "vertical",
      whiteSpace: "pre",
      overflowWrap: "normal",
      tabSize: "4",
    },
  });

  return [inlineEditPlugin, inlineEditTheme];
}
