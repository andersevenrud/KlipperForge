import { hasLocalConfigs, readLocalConfigIndex } from "@/api/local-storage-reader";
import { useConfigStorage } from "@/context/config-storage-context";
import { useCallback, useMemo, useState } from "react";

interface LocalConfigDetectionResult {
  hasLocalConfigs: boolean;
  localConfigCount: number;
  dismissed: boolean;
  dismiss: () => void;
  recheck: () => void;
}

export function useLocalConfigDetection(): LocalConfigDetectionResult {
  const { mode } = useConfigStorage();
  const [dismissed, setDismissed] = useState(false);
  const [recheckKey, setRecheckKey] = useState(0);

  const dismiss = useCallback(() => setDismissed(true), []);
  const recheck = useCallback(() => {
    setRecheckKey((k) => k + 1);
    setDismissed(false);
  }, []);

  const detection = useMemo(() => {
    // recheckKey is used to force re-evaluation after import
    void recheckKey;

    if (mode !== "remote") {
      return { hasLocalConfigs: false, localConfigCount: 0 };
    }

    if (!hasLocalConfigs()) {
      return { hasLocalConfigs: false, localConfigCount: 0 };
    }

    const configs = readLocalConfigIndex();
    return { hasLocalConfigs: configs.length > 0, localConfigCount: configs.length };
  }, [mode, recheckKey]);

  return {
    ...detection,
    dismissed,
    dismiss,
    recheck,
  };
}
