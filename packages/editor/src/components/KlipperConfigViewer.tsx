import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { editorTheme } from "../extensions/editor-theme";
import { flashLineExtension } from "../extensions/flash-line-extension";
import { klipperLanguage } from "../extensions/klipper-language";

const baseExtensions = [klipperLanguage, EditorView.lineWrapping];

export interface KlipperConfigViewerProps {
  value: string;
  onCreateEditor?: (view: EditorView) => void;
}

export function KlipperConfigViewer({ value, onCreateEditor }: KlipperConfigViewerProps) {
  const extensions = useMemo(
    () => (onCreateEditor ? [...baseExtensions, flashLineExtension] : baseExtensions),
    [onCreateEditor],
  );

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
      onCreateEditor={onCreateEditor}
    />
  );
}
