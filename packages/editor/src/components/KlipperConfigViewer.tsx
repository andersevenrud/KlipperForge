import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "../extensions/editor-theme";
import { klipperLanguage } from "../extensions/klipper-language";

const extensions = [klipperLanguage, EditorView.lineWrapping];

export interface KlipperConfigViewerProps {
  value: string;
}

export function KlipperConfigViewer({ value }: KlipperConfigViewerProps) {
  return (
    <CodeMirror
      value={value}
      theme={editorTheme}
      extensions={extensions}
      readOnly
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: false,
      }}
    />
  );
}
