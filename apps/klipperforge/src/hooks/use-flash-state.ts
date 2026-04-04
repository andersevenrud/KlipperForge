import { getErrorMessage } from "@/lib/utils";
import type { FlashProgress, FlashResult } from "@klipperforge/dfu";
import { useCallback, useRef, useState } from "react";

type FlashState = "idle" | "connecting" | "flashing" | "complete" | "error";

interface UseFlashStateResult<TArgs extends unknown[]> {
  state: FlashState;
  progress: FlashProgress | null;
  result: FlashResult | null;
  flash: (...args: TArgs) => Promise<FlashResult>;
  cancel: () => void;
  reset: () => void;
}

export function useFlashState<TArgs extends unknown[]>(
  flashFn: (
    abortController: AbortController,
    onProgress: (p: FlashProgress) => void,
    ...args: TArgs
  ) => Promise<FlashResult>,
): UseFlashStateResult<TArgs> {
  const [state, setState] = useState<FlashState>("idle");
  const [progress, setProgress] = useState<FlashProgress | null>(null);
  const [result, setResult] = useState<FlashResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const flash = useCallback(
    async (...args: TArgs): Promise<FlashResult> => {
      setState("connecting");
      setProgress(null);
      setResult(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        setState("flashing");
        const flashResult = await flashFn(abortController, setProgress, ...args);
        setResult(flashResult);
        setState(flashResult.success ? "complete" : "error");
        return flashResult;
      } catch (err) {
        const error = getErrorMessage(err, "Unknown error");
        const errorResult: FlashResult = { success: false, error, duration: 0 };
        setResult(errorResult);
        setState("error");
        return errorResult;
      } finally {
        abortRef.current = null;
      }
    },
    [flashFn],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setProgress(null);
    setResult(null);
  }, []);

  return { state, progress, result, flash, cancel, reset };
}
