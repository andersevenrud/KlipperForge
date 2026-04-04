import { Button } from "@/components/ui/button";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { type KeyboardEvent, useCallback, useState } from "react";

interface InitialPinsInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function parsePins(value: string): string[] {
  return value
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function InitialPinsInput({ value, onChange, disabled }: InitialPinsInputProps) {
  const [prefix, setPrefix] = useState<"!" | "none">("!");
  const [pinName, setPinName] = useState("");

  const pins = parsePins(value);

  const addPin = useCallback(
    function addPin() {
      const trimmed = pinName.trim().toUpperCase();
      if (!trimmed) return;

      const fullPin = `${prefix === "!" ? "!" : ""}${trimmed}`;
      if (pins.includes(fullPin)) {
        setPinName("");
        return;
      }

      const updated = [...pins, fullPin].join(" ");
      onChange(updated);
      setPinName("");
    },
    [pinName, prefix, pins, onChange],
  );

  const removePin = useCallback(
    function removePin(pinToRemove: string) {
      const updated = pins.filter((p) => p !== pinToRemove).join(" ");
      onChange(updated);
    },
    [pins, onChange],
  );

  const handleKeyDown = useCallback(
    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        e.preventDefault();
        addPin();
      }
    },
    [addPin],
  );

  return (
    <div className="space-y-2">
      <FieldWrapper name="GPIO pins to set at startup" disabled={disabled}>
        {({ disabled }) => (
          <div className="space-y-2">
            {pins.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pins.map((pin) => (
                  <span
                    key={pin}
                    className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-xs font-mono"
                  >
                    {pin}
                    <button
                      type="button"
                      onClick={() => removePin(pin)}
                      disabled={disabled}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Select value={prefix} onValueChange={(v) => setPrefix(v as "!" | "none")} disabled={disabled}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="!">! LOW</SelectItem>
                  <SelectItem value="none">HIGH</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={pinName}
                onChange={(e) => setPinName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pin name (e.g. PA14)"
                disabled={disabled}
                className="flex-1 font-mono"
              />
              <Button type="button" variant="outline" size="sm" onClick={addPin} disabled={disabled || !pinName.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}
      </FieldWrapper>
    </div>
  );
}
