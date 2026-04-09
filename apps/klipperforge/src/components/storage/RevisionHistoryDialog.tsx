import { useState } from "react";
import type { RevisionSummary } from "@/api/config-storage-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RevisionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: RevisionSummary[];
  currentRevision: number;
  onRestore: (revisionNumber: number) => Promise<void>;
  isLoading: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function RevisionHistoryDialog({
  open,
  onOpenChange,
  revisions,
  currentRevision,
  onRestore,
  isLoading,
}: RevisionHistoryDialogProps) {
  const [restoringRev, setRestoringRev] = useState<number | null>(null);

  async function handleRestore(revisionNumber: number) {
    setRestoringRev(revisionNumber);
    try {
      await onRestore(revisionNumber);
    } finally {
      setRestoringRev(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Revision History</DialogTitle>
          <DialogDescription>Browse and restore previous versions of this config.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : revisions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No revisions found.</p>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {revisions.map((rev) => (
              <div key={rev.number} className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Rev {rev.number}</span>
                    {rev.number === currentRevision && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleString()} &middot; {formatBytes(rev.documentSize)}
                  </p>
                  {rev.comment && <p className="mt-1 text-xs text-muted-foreground">{rev.comment}</p>}
                </div>
                {rev.number !== currentRevision && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-3"
                    onClick={() => handleRestore(rev.number)}
                    disabled={restoringRev === rev.number}
                  >
                    {restoringRev === rev.number ? "Restoring..." : "Restore"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
