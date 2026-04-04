import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "../extensions/editor-theme";

const extensions = [json(), EditorView.lineWrapping];

export interface JsonViewerProps {
  value: string;
}

export function JsonViewer({ value }: JsonViewerProps) {
  return (
    <div className="h-full">
      <CodeMirror
        value={value}
        height="100%"
        theme={editorTheme}
        extensions={extensions}
        readOnly
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: false,
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
      />
    </div>
  );
}
