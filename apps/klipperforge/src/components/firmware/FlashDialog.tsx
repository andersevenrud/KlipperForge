import type { BoardFlashInfo, FlashMethod } from "@/api/firmware-types";
import { Button } from "@/components/ui/button";
import { useFirmwareFlash } from "@/hooks/use-firmware-flash";
import { Cable, Usb } from "lucide-react";
import { useCallback, useState } from "react";
import { FlashInstructions } from "./FlashInstructions";
import { FlashProgress } from "./FlashProgress";

interface FlashDialogProps {
  firmware: Uint8Array;
  flashAddress: string;
  mcuFamily: string;
  flashMethods: FlashMethod[];
  boardFlash?: BoardFlashInfo;
  onClose: () => void;
}

export function FlashDialog({
  firmware,
  flashAddress,
  mcuFamily,
  flashMethods,
  boardFlash,
  onClose,
}: FlashDialogProps) {
  const { availableMethods, state, progress, flash, cancel, reset } = useFirmwareFlash(flashMethods);
  const [selectedMethod, setSelectedMethod] = useState<FlashMethod>(availableMethods[0] ?? "dfu");

  const handleFlash = useCallback(async () => {
    await flash(firmware, flashAddress, selectedMethod, mcuFamily, {
      baudRate: boardFlash?.serialFlashBaud,
      parity: (boardFlash?.serialFlashParity as "none" | "even" | "odd") ?? undefined,
    });
  }, [firmware, flashAddress, selectedMethod, mcuFamily, boardFlash, flash]);

  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  const isFlashing = state === "connecting" || state === "flashing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Flash Firmware</h3>
          {!isFlashing && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {/* Method selector (only if multiple available) */}
          {state === "idle" && availableMethods.length > 1 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Flash method</span>
              <div className="flex gap-2">
                {availableMethods.map((method) => (
                  <Button
                    key={method}
                    size="sm"
                    variant={selectedMethod === method ? "default" : "outline"}
                    onClick={() => setSelectedMethod(method)}
                  >
                    {method === "dfu" ? <Usb className="size-4" /> : <Cable className="size-4" />}
                    {method === "dfu" ? "USB DFU" : "Serial"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions before flashing */}
          {state === "idle" && (
            <>
              <FlashInstructions method={selectedMethod} dfuModeInstructions={boardFlash?.dfuModeInstructions} />
              <Button className="w-full" onClick={handleFlash}>
                {selectedMethod === "dfu" ? <Usb className="size-4" /> : <Cable className="size-4" />}
                Connect & Flash
              </Button>
            </>
          )}

          {/* Progress during flashing */}
          {(isFlashing || state === "complete" || state === "error") && progress && (
            <FlashProgress
              progress={progress}
              onCancel={cancel}
              onRetry={state === "error" ? handleRetry : undefined}
            />
          )}

          {/* Info line */}
          <div className="text-xs text-muted-foreground">
            {firmware.length.toLocaleString()} bytes at {flashAddress} ({mcuFamily})
          </div>
        </div>
      </div>
    </div>
  );
}
