import { detectFlashSupport } from "@klipperforge/dfu";
import { Info } from "lucide-react";
import { useMemo } from "react";

export function BrowserFlashSupport() {
  const support = useMemo(() => detectFlashSupport(), []);

  if (support.webUsb || support.webSerial) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 rounded-md border border-blue-500/30 bg-blue-500/5 p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
      <div className="text-sm">
        <p className="font-medium">Browser-based flashing unavailable</p>
        <p className="mt-1 text-muted-foreground">
          Browser-based flashing requires Chrome, Edge, or Opera. Use the download button and flash via SD card,
          STM32CubeProgrammer, or stm32flash.
        </p>
      </div>
    </div>
  );
}
