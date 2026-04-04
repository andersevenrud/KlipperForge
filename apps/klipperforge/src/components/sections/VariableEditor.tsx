import { KeyValueEditor, type KeyValueEntry } from "@/components/sections/KeyValueEditor";
import type { ConfigValue } from "@klipperforge/klipper-config";
import { useCallback } from "react";

interface VariableEditorProps {
  header: string;
  variables: Record<string, ConfigValue>;
  onChange: (variables: Record<string, ConfigValue>) => void;
}

const PREFIX = "variable_";

export function VariableEditor({ header, variables, onChange }: VariableEditorProps) {
  const entries: KeyValueEntry[] = Object.entries(variables).map(([key, value]) => ({
    key: key.slice(PREFIX.length),
    value: String(value),
  }));

  const handleChange = useCallback(
    (updated: KeyValueEntry[]) => {
      const result: Record<string, ConfigValue> = {};
      for (const entry of updated) {
        result[`${PREFIX}${entry.key}`] = entry.value;
      }
      onChange(result);
    },
    [onChange],
  );

  return (
    <KeyValueEditor
      label="Variables"
      header={header}
      entries={entries}
      onChange={handleChange}
      keyPlaceholder="name"
      valuePlaceholder="value"
      addLabel="Add Variable"
    />
  );
}
