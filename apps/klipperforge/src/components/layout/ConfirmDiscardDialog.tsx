import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfig } from "@/context/config-context";

interface ConfirmDiscardContextValue {
  confirmDiscardIfDirty: () => Promise<boolean>;
}

const ConfirmDiscardContext = createContext<ConfirmDiscardContextValue | null>(null);

interface ConfirmDiscardProviderProps {
  children: ReactNode;
}

export function ConfirmDiscardProvider({ children }: ConfirmDiscardProviderProps) {
  const { state } = useConfig();
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirmDiscardIfDirty = useCallback(() => {
    if (!state.isDirty) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, [state.isDirty]);

  const resolve = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resolve(false);
    },
    [resolve],
  );

  const value = useMemo(() => ({ confirmDiscardIfDirty }), [confirmDiscardIfDirty]);

  return (
    <ConfirmDiscardContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Discard current draft?</DialogTitle>
            <DialogDescription>
              Your current draft has unsaved changes. This browser session is the only place they exist. Continuing will
              replace them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => resolve(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => resolve(true)}>
              Discard and continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDiscardContext.Provider>
  );
}

export function useConfirmDiscard(): ConfirmDiscardContextValue {
  const context = useContext(ConfirmDiscardContext);
  if (!context) {
    throw new Error("useConfirmDiscard must be used within a ConfirmDiscardProvider");
  }
  return context;
}
