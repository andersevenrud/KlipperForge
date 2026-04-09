import type { FlashProgress, FlashResult } from "@klipperforge/dfu";
import { flashDfu, requestDfuDevice } from "@klipperforge/dfu";
import { useCallback } from "react";
import { useFlashState } from "./use-flash-state";

export function useDfuFlash() {
  const flashFn = useCallback(
    async (
      abortController: AbortController,
      onProgress: (p: FlashProgress) => void,
      firmware: Uint8Array,
      flashAddress: string,
      mcuFamily: string,
    ): Promise<FlashResult> => {
      const device = await requestDfuDevice();
      return flashDfu(device, firmware, flashAddress, mcuFamily, {
        onProgress,
        signal: abortController.signal,
      });
    },
    [],
  );

  return useFlashState(flashFn);
}
