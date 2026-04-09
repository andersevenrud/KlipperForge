import { Upload, Usb, Zap } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { FlashMethod } from "@/api/firmware-types";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { useFirmwareFlash } from "@/hooks/use-firmware-flash";
import { BrowserFlashSupport } from "./BrowserFlashSupport";
import { FlashDialog } from "./FlashDialog";

interface McuOffsetEntry {
  id: string;
  label: string;
  flashAddress: string;
}

interface McuOption {
  family: string;
  flashMethods: FlashMethod[];
  offsets: McuOffsetEntry[];
}

const MCU_OPTIONS: McuOption[] = [
  {
    family: "STM32F103",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "28KiB", label: "28KiB bootloader", flashAddress: "0x08007000" },
    ],
  },
  {
    family: "STM32F401",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "16KiB", label: "16KiB bootloader", flashAddress: "0x08004000" },
      { id: "64KiB", label: "64KiB bootloader", flashAddress: "0x08010000" },
    ],
  },
  {
    family: "STM32F405",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "32KiB", label: "32KiB bootloader", flashAddress: "0x08008000" },
      { id: "64KiB", label: "64KiB bootloader", flashAddress: "0x08010000" },
    ],
  },
  {
    family: "STM32F407",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "32KiB", label: "32KiB bootloader", flashAddress: "0x08008000" },
      { id: "64KiB", label: "64KiB bootloader", flashAddress: "0x08010000" },
    ],
  },
  {
    family: "STM32F446",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "32KiB", label: "32KiB bootloader", flashAddress: "0x08008000" },
      { id: "64KiB", label: "64KiB bootloader", flashAddress: "0x08010000" },
    ],
  },
  {
    family: "STM32G0B1",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "8KiB", label: "8KiB bootloader", flashAddress: "0x08002000" },
    ],
  },
  {
    family: "STM32H723",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "128KiB", label: "128KiB bootloader", flashAddress: "0x08020000" },
    ],
  },
  {
    family: "STM32H743",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "128KiB", label: "128KiB bootloader", flashAddress: "0x08020000" },
    ],
  },
  {
    family: "STM32F072",
    flashMethods: ["dfu", "serial"],
    offsets: [
      { id: "none", label: "No bootloader", flashAddress: "0x08000000" },
      { id: "8KiB", label: "8KiB bootloader", flashAddress: "0x08002000" },
    ],
  },
];

export function StandaloneFlashTool() {
  const [firmware, setFirmware] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedMcu, setSelectedMcu] = useState<string>(MCU_OPTIONS[0].family);
  const [selectedOffset, setSelectedOffset] = useState<string>("none");
  const [showFlashDialog, setShowFlashDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mcuOption = MCU_OPTIONS.find((m) => m.family === selectedMcu) ?? MCU_OPTIONS[0];
  const offset = mcuOption.offsets.find((o) => o.id === selectedOffset) ?? mcuOption.offsets[0];
  const { canFlash } = useFirmwareFlash(mcuOption.flashMethods);

  const loadFirmwareFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFirmware(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFirmwareFile(file);
    },
    [loadFirmwareFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) loadFirmwareFile(file);
    },
    [loadFirmwareFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="size-6 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Flash Tool</h2>
          <p className="text-sm text-muted-foreground">Flash a firmware .bin file directly to your board</p>
        </div>
      </div>

      <BrowserFlashSupport />

      {/* File upload */}
      <button
        type="button"
        className="w-full cursor-pointer rounded-md border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">{fileName ?? "Drop firmware .bin file here or click to select"}</p>
        {firmware && <p className="mt-1 text-xs text-muted-foreground">{firmware.length.toLocaleString()} bytes</p>}
        <input ref={fileInputRef} type="file" accept=".bin" className="hidden" onChange={handleFileChange} />
      </button>

      {/* MCU family selector */}
      <div className="space-y-2">
        <FieldWrapper name="MCU Family">
          {({ id }) => (
            <select
              id={id}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={selectedMcu}
              onChange={(e) => {
                setSelectedMcu(e.target.value);
                setSelectedOffset("none");
              }}
            >
              {MCU_OPTIONS.map((mcu) => (
                <option key={mcu.family} value={mcu.family}>
                  {mcu.family}
                </option>
              ))}
            </select>
          )}
        </FieldWrapper>
      </div>

      {/* Flash address selector */}
      <div className="space-y-2">
        <FieldWrapper name="Bootloader Offset">
          {({ id }) => (
            <select
              id={id}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={selectedOffset}
              onChange={(e) => setSelectedOffset(e.target.value)}
            >
              {mcuOption.offsets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} ({o.flashAddress})
                </option>
              ))}
            </select>
          )}
        </FieldWrapper>
      </div>

      {/* Flash button */}
      <Button className="w-full" disabled={!firmware || !canFlash} onClick={() => setShowFlashDialog(true)}>
        <Usb className="size-4" />
        Flash to Device
      </Button>

      {!canFlash && firmware && (
        <p className="text-xs text-muted-foreground">
          Browser-based flashing requires Chrome, Edge, or Opera with WebUSB or Web Serial support.
        </p>
      )}

      {/* Flash dialog */}
      {showFlashDialog && firmware && (
        <FlashDialog
          firmware={firmware}
          flashAddress={offset.flashAddress}
          mcuFamily={selectedMcu}
          flashMethods={mcuOption.flashMethods}
          onClose={() => setShowFlashDialog(false)}
        />
      )}
    </div>
  );
}
