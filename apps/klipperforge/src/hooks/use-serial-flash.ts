import type { FlashProgress, FlashResult } from "@klipperforge/dfu";
import { flashSerial, requestSerialPort } from "@klipperforge/dfu";
import { useCallback } from "react";
import { useFlashState } from "./use-flash-state";

export function useSerialFlash() {
  const flashFn = useCallback(
    async (
      abortController: AbortController,
      onProgress: (p: FlashProgress) => void,
      firmware: Uint8Array,
      flashAddress: string,
      baudRate = 115200,
      parity: "none" | "even" | "odd" = "even",
    ): Promise<FlashResult> => {
      const port = await requestSerialPort();
      return flashSerial(
        port,
        firmware,
        flashAddress,
        { baudRate, parity },
        {
          onProgress,
          signal: abortController.signal,
        },
      );
    },
    [],
  );

  return useFlashState(flashFn);
}
