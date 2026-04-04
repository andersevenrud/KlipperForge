import type { ConfigSummary } from "@/api/config-storage-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HardDrive, Trash2 } from "lucide-react";
import { useState } from "react";

interface ConfigListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configs: ConfigSummary[];
  maxConfigs: number;
  onLoad: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
  storageMode: "local" | "remote";
  onSignIn?: () => void;
}

export function ConfigListDialog({
  open,
  onOpenChange,
  configs,
  maxConfigs,
  onLoad,
  onDelete,
  isLoading,
  storageMode,
  onSignIn,
}: ConfigListDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>My Configs</DialogTitle>
          <DialogDescription>
            {storageMode === "local"
              ? `Configs stored in this browser. ${configs.length} of ${maxConfigs} used.`
              : `Load or manage your saved configurations. ${configs.length} of ${maxConfigs} configs used.`}
          </DialogDescription>
        </DialogHeader>
        {storageMode === "local" && onSignIn && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            <span>
              Configs are stored in this browser only.{" "}
              <button
                type="button"
                onClick={onSignIn}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Sign in
              </button>{" "}
              to sync across devices.
            </span>
          </div>
        )}
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : configs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No saved configs yet. Use "Save As" to save your first config.
          </p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {configs.map((cfg) => (
              <div key={cfg.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{cfg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Rev {cfg.currentRevision} &middot; {new Date(cfg.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onLoad(cfg.id)}>
                    Load
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => handleDelete(cfg.id)}
                    disabled={deletingId === cfg.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
