import { useCallback, useEffect, useRef, useState } from "react";

interface UseCopyFeedbackResult {
  copiedKey: string | null;
  copy: (text: string, key?: string) => void;
}

export function useCopyFeedback(resetMs = 2000): UseCopyFeedbackResult {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const copy = useCallback(
    (text: string, key?: string) => {
      navigator.clipboard.writeText(text);
      setCopiedKey(key ?? text);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setCopiedKey(null);
        timerRef.current = null;
      }, resetMs);
    },
    [resetMs],
  );

  useEffect(function cleanupCopyTimerEffect() {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { copiedKey, copy };
}
