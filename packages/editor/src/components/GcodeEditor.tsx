import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo } from "react";
import { editorTheme } from "../extensions/editor-theme";
import { klipperLanguage } from "../extensions/klipper-language";

export interface GcodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function GcodeEditor({ value, onChange, disabled, id }: GcodeEditorProps) {
  const extensions = useMemo(() => [klipperLanguage, EditorView.lineWrapping], []);

  return (
    <div
      id={id}
      className={`overflow-hidden rounded-md border border-input ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={editorTheme}
        extensions={extensions}
        readOnly={disabled}
        editable={!disabled}
        minHeight="60px"
        maxHeight="300px"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
        }}
        className="text-xs [&_.cm-editor]:!outline-none [&_.cm-gutters]:!border-0 [&_.cm-gutters]:!bg-transparent"
      />
    </div>
  );
}
