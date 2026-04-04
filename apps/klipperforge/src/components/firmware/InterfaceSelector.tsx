import type { PresetResponse } from "@/api/firmware-types";
import { FieldWrapper } from "@/components/ui/field-wrapper";

interface InterfaceSelectorProps {
  preset: PresetResponse;
  selectedInterface: string | null;
  onSelect: (interfaceId: string) => void;
  disabled?: boolean;
}

export function InterfaceSelector({ preset, selectedInterface, onSelect, disabled }: InterfaceSelectorProps) {
  return (
    <div className="space-y-2">
      <FieldWrapper name="Communication interface" disabled={disabled}>
        {({ disabled }) => (
          <div className="space-y-1">
            {preset.interfaces.map((iface) => (
              <label
                key={iface.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  selectedInterface === iface.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                } ${disabled ? "pointer-events-none opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="firmware-interface"
                  value={iface.id}
                  checked={selectedInterface === iface.id}
                  onChange={() => onSelect(iface.id)}
                  disabled={disabled}
                  className="accent-primary"
                />
                {iface.label}
              </label>
            ))}
          </div>
        )}
      </FieldWrapper>
    </div>
  );
}
