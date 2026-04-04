import { Button } from "@/components/ui/button";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { useEditorScroll } from "@klipperforge/editor";
import { Plus, X } from "lucide-react";
import { useCallback, useRef } from "react";

export interface KeyValueEntry {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  label: string;
  header: string;
  entries: KeyValueEntry[];
  onChange: (entries: KeyValueEntry[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export function KeyValueEditor({
  label,
  header,
  entries,
  onChange,
  keyPlaceholder = "name",
  valuePlaceholder = "value",
  addLabel = "Add Entry",
}: KeyValueEditorProps) {
  const { scrollToField } = useEditorScroll();

  const nextId = useRef(0);
  const rowIds = useRef<number[]>(entries.map(() => nextId.current++));

  if (rowIds.current.length !== entries.length) {
    rowIds.current = entries.map(() => nextId.current++);
  }

  const update = useCallback(
    (index: number, field: "key" | "value", newVal: string) => {
      const updated = entries.map((entry, i) => (i === index ? { ...entry, [field]: newVal } : entry));
      onChange(updated);
    },
    [entries, onChange],
  );

  const add = useCallback(() => {
    rowIds.current.push(nextId.current++);
    onChange([...entries, { key: "", value: "" }]);
  }, [entries, onChange]);

  const remove = useCallback(
    (index: number) => {
      rowIds.current.splice(index, 1);
      onChange(entries.filter((_, i) => i !== index));
    },
    [entries, onChange],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <FieldWrapper name={label}>
        {() => (
          <>
            {entries.map((entry, index) => (
              <div
                key={rowIds.current[index]}
                id={`${header}-kv-${index}`}
                data-field-id={entry.key ? `${header}-aliases.${entry.key}` : undefined}
                className="flex flex-col gap-1 md:flex-row md:items-center"
                onFocus={() => {
                  if (entry.key) {
                    scrollToField(header, entry.key);
                  }
                }}
              >
                <Input
                  className="h-7 flex-1 font-mono text-xs"
                  placeholder={keyPlaceholder}
                  value={entry.key}
                  onChange={(e) => update(index, "key", e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <Input
                    className="h-7 flex-1 font-mono text-xs"
                    placeholder={valuePlaceholder}
                    value={entry.value}
                    onChange={(e) => update(index, "value", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => remove(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="xs" className="w-fit" onClick={add}>
              <Plus className="h-3 w-3" />
              {addLabel}
            </Button>
          </>
        )}
      </FieldWrapper>
    </div>
  );
}
