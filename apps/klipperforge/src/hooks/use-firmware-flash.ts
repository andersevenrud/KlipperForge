import type { FlashResult } from "@klipperforge/dfu";
import { canFlashDfu, canFlashSerial } from "@klipperforge/dfu";
import { useCallback, useMemo } from "react";
import type { FlashMethod } from "@/api/firmware-types";
import { useDfuFlash } from "./use-dfu-flash";
import { useSerialFlash } from "./use-serial-flash";

interface SerialFlashConfig {
  baudRate?: number;
  parity?: "none" | "even" | "odd";
}

export function useFirmwareFlash(flashMethods?: FlashMethod[]) {
  const dfu = useDfuFlash();
  const serial = useSerialFlash();

  const availableMethods = useMemo(() => {
    if (!flashMethods) return [];
    const methods: FlashMethod[] = [];

    if (flashMethods.includes("dfu") && canFlashDfu()) {
      methods.push("dfu");
    }
    if (flashMethods.includes("serial") && canFlashSerial()) {
      methods.push("serial");
    }

    return methods;
  }, [flashMethods]);

  const canFlash = availableMethods.length > 0;

  const activeHook = dfu.state !== "idle" ? dfu : serial.state !== "idle" ? serial : null;
  const state = activeHook?.state ?? "idle";
  const progress = activeHook?.progress ?? null;
  const result = activeHook?.result ?? null;

  const flash = useCallback(
    async (
      firmware: Uint8Array,
      flashAddress: string,
      method: FlashMethod,
      mcuFamily: string,
      serialConfig?: SerialFlashConfig,
    ): Promise<FlashResult> => {
      if (method === "dfu") {
        return dfu.flash(firmware, flashAddress, mcuFamily);
      }
      return serial.flash(firmware, flashAddress, serialConfig?.baudRate, serialConfig?.parity);
    },
    [dfu, serial],
  );

  const cancel = useCallback(() => {
    dfu.cancel();
    serial.cancel();
  }, [dfu, serial]);

  const reset = useCallback(() => {
    dfu.reset();
    serial.reset();
  }, [dfu, serial]);

  return {
    availableMethods,
    canFlash,
    state,
    progress,
    result,
    flash,
    cancel,
    reset,
  };
}
