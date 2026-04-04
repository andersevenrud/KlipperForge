import type { FlashMethod } from "@/api/firmware-types";
import { Cable, Usb } from "lucide-react";

interface FlashInstructionsProps {
  method: FlashMethod;
  dfuModeInstructions?: string;
}

export function FlashInstructions({ method, dfuModeInstructions }: FlashInstructionsProps) {
  const isDfu = method === "dfu";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {isDfu ? <Usb className="size-4" /> : <Cable className="size-4" />}
        {isDfu ? "USB DFU Flashing" : "Serial UART Flashing"}
      </div>

      <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
        {isDfu ? (
          <>
            <li>Enter DFU mode: {dfuModeInstructions ?? "Set the BOOT0 jumper to 3.3V and press the reset button."}</li>
            <li>Connect the board to your computer via USB.</li>
            <li>Click &quot;Connect&quot; and select the STM32 DFU device in the browser dialog.</li>
            <li>Flashing will begin automatically.</li>
          </>
        ) : (
          <>
            <li>Connect the board to your computer via a USB-to-serial adapter (TX, RX, GND).</li>
            <li>
              Enter bootloader mode: {dfuModeInstructions ?? "Set the BOOT0 jumper to 3.3V and press the reset button."}
            </li>
            <li>Click &quot;Connect&quot; and select the serial port in the browser dialog.</li>
            <li>Flashing will begin automatically.</li>
          </>
        )}
      </ol>
    </div>
  );
}
