import type { PresetResponse } from "@/api/firmware-types";
import { InitialPinsInput } from "@/components/firmware/InitialPinsInput";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OptionsPanelProps {
  preset: PresetResponse;
  selectedInterface: string | null;
  options: Record<string, string>;
  onOptionChange: (key: string, value: string) => void;
  disabled?: boolean;
}

export function OptionsPanel({ preset, selectedInterface, options, onOptionChange, disabled }: OptionsPanelProps) {
  const interfaceDef = preset.interfaces.find((i) => i.id === selectedInterface);
  const interfaceOptions = interfaceDef?.options ?? [];
  const hasBootloaderOptions = preset.bootloaderOffsets.length > 1;
  const hasClockOptions = preset.clockRefs.length > 1;

  return (
    <div className="space-y-3">
      {hasBootloaderOptions && (
        <div className="space-y-2">
          <FieldWrapper name="Bootloader offset" disabled={disabled}>
            {({ id, disabled }) => (
              <Select
                value={options.bootloaderOffset ?? preset.bootloaderOffsets[0]?.id}
                onValueChange={(v) => onOptionChange("bootloaderOffset", v)}
                disabled={disabled}
              >
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preset.bootloaderOffsets.map((bl) => (
                    <SelectItem key={bl.id} value={bl.id}>
                      {bl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        </div>
      )}

      {hasClockOptions && (
        <div className="space-y-2">
          <FieldWrapper name="Clock reference" disabled={disabled}>
            {({ id, disabled }) => (
              <Select
                value={options.clockRef ?? preset.clockRefs[0]?.id}
                onValueChange={(v) => onOptionChange("clockRef", v)}
                disabled={disabled}
              >
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preset.clockRefs.map((cr) => (
                    <SelectItem key={cr.id} value={cr.id}>
                      {cr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        </div>
      )}

      {interfaceOptions.map((opt) => (
        <div key={opt.key} className="space-y-2">
          <FieldWrapper name={opt.label} disabled={disabled}>
            {({ id, disabled }) => (
              <Select
                value={options[opt.key] ?? opt.default}
                onValueChange={(v) => onOptionChange(opt.key, v)}
                disabled={disabled}
              >
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opt.values.map((val) => (
                    <SelectItem key={val} value={val}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        </div>
      ))}

      <InitialPinsInput
        value={options.CONFIG_INITIAL_PINS ?? ""}
        onChange={(v) => onOptionChange("CONFIG_INITIAL_PINS", v)}
        disabled={disabled}
      />
    </div>
  );
}
