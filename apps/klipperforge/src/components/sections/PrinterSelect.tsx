import type { PrinterPreset } from "@klipperforge/printer-data";
import { loadPrinterPreset } from "@klipperforge/printer-data";
import { useEffect, useMemo, useRef, useState } from "react";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig } from "@/context/config-context";
import { usePrinterIndexQuery } from "@/hooks/use-queries";

interface PrinterSelectSelection {
  preset: PrinterPreset;
  variantId?: string;
}

interface PrinterSelectProps {
  onSelectionChange?: (selection: PrinterSelectSelection | null) => void;
}

export function PrinterSelect({ onSelectionChange }: PrinterSelectProps) {
  const { state } = useConfig();
  const indexQuery = usePrinterIndexQuery();
  const index = indexQuery.data;
  const [vendor, setVendor] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [variant, setVariant] = useState<string | null>(null);
  const cachedPresetRef = useRef<PrinterPreset | null>(null);

  const vendors = useMemo(() => {
    const set = new Set<string>();
    for (const p of index.printers) {
      set.add(p.manufacturer);
    }
    return [...set].sort();
  }, [index]);

  const models = useMemo(() => {
    if (!vendor) return [];
    return index.printers.filter((p) => p.manufacturer === vendor);
  }, [index, vendor]);

  const variants = useMemo(() => {
    if (!model) return [];
    const entry = index.printers.find((p) => p.id === model);
    return entry?.variants ?? [];
  }, [index, model]);

  const { presetId } = state.document;
  const { configEpoch } = state;

  function handleVendorChange(value: string) {
    setVendor(value);
    setModel(null);
    setVariant(null);
    cachedPresetRef.current = null;
    onSelectionChange?.(null);
  }

  async function handleModelChange(value: string) {
    setModel(value);
    setVariant(null);
    try {
      const preset = await loadPrinterPreset(value);
      cachedPresetRef.current = preset;
      if (preset.variants && preset.variants.length > 0) {
        const firstVariant = preset.variants[0];
        setVariant(firstVariant.id);
        onSelectionChange?.({ preset, variantId: firstVariant.id });
      } else {
        onSelectionChange?.({ preset });
      }
    } catch {
      cachedPresetRef.current = null;
      onSelectionChange?.(null);
    }
  }

  function handleVariantChange(value: string) {
    setVariant(value);
    const preset = cachedPresetRef.current;
    if (preset) {
      onSelectionChange?.({ preset, variantId: value });
    }
  }

  const modelDisabled = !vendor || models.length === 0;
  const variantDisabled = !model || variants.length === 0;

  useEffect(
    function syncDropdownsEffect() {
      void configEpoch;
      if (presetId) {
        const [baseId, variantId] = presetId.split(":");
        const entry = index.printers.find((p) => p.id === baseId);
        if (entry) {
          setVendor(entry.manufacturer);
          setModel(entry.id);
          setVariant(variantId ?? null);
          return;
        }
      }
      setVendor(null);
      setModel(null);
      setVariant(null);
    },
    [index, presetId, configEpoch],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <FieldWrapper name="Manufacturer">
          {({ id }) => (
            <Select value={vendor ?? undefined} onValueChange={handleVendorChange}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Select a manufacturer" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldWrapper>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <FieldWrapper name="Model" disabled={modelDisabled}>
          {({ id, disabled }) => (
            <Select value={model ?? ""} onValueChange={handleModelChange} disabled={disabled}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldWrapper>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <FieldWrapper name="Variant" disabled={variantDisabled || variants.length === 0}>
          {({ id, disabled }) => (
            <Select value={variant ?? ""} onValueChange={handleVariantChange} disabled={disabled}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Select a variant" />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FieldWrapper>
      </div>
    </div>
  );
}
