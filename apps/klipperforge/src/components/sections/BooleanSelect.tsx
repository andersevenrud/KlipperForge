import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BooleanSelectProps {
  value: boolean | null | undefined;
  onChange: (value: boolean | null) => void;
  id?: string;
  disabled?: boolean;
}

export function BooleanSelect({ value, onChange, id, disabled }: BooleanSelectProps) {
  const stringValue = value === true ? "True" : value === false ? "False" : "__unset__";

  function handleChange(v: string) {
    onChange(v === "True" ? true : v === "False" ? false : null);
  }

  return (
    <Select disabled={disabled} value={stringValue} onValueChange={handleChange}>
      <SelectTrigger id={id} className="h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__unset__" className="text-xs text-muted-foreground">
          —
        </SelectItem>
        <SelectItem value="True" className="text-xs">
          True
        </SelectItem>
        <SelectItem value="False" className="text-xs">
          False
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
