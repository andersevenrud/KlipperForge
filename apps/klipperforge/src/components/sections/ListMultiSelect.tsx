import { useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldWrapper } from "@/components/ui/field-wrapper";

interface ListMultiSelectProps {
  id: string;
  disabled: boolean;
  choices: string[];
  value: string;
  separator: string;
  onChange: (value: string) => void;
}

export function ListMultiSelect({ id, disabled, choices, value, separator, onChange }: ListMultiSelectProps) {
  const selected = useMemo(() => {
    if (!value) return new Set<string>();
    return new Set(
      value
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [value]);

  const handleToggle = useCallback(
    (item: string, checked: boolean) => {
      const next = new Set(selected);
      if (checked) {
        next.add(item);
      } else {
        next.delete(item);
      }
      onChange(Array.from(next).join(separator));
    },
    [selected, separator, onChange],
  );

  if (choices.length === 0) {
    return <p className="text-xs text-muted-foreground">No temperature sensors available</p>;
  }

  return (
    <div id={id} className="flex flex-col gap-1.5 rounded-md border border-border/50 p-2">
      {choices.map((choice) => (
        <FieldWrapper key={choice} name={choice} inline disabled={disabled}>
          {({ id, disabled }) => (
            <Checkbox
              id={id}
              disabled={!!disabled}
              checked={selected.has(choice)}
              onCheckedChange={(checked) => handleToggle(choice, checked === true)}
            />
          )}
        </FieldWrapper>
      ))}
    </div>
  );
}
