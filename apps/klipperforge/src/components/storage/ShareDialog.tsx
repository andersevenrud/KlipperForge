import type { ShareInfo } from "@/api/config-storage-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Check, Copy, Link, Trash2 } from "lucide-react";
import { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shares: ShareInfo[];
  onCreateShare: () => Promise<void>;
  onDeleteShare: (shareId: string) => Promise<void>;
  isCreating: boolean;
  isDirty: boolean;
}

function getShareUrl(shareToken: string): string {
  return `${window.location.origin}/shared/${shareToken}`;
}

export function ShareDialog({
  open,
  onOpenChange,
  shares,
  onCreateShare,
  onDeleteShare,
  isCreating,
  isDirty,
}: ShareDialogProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  function handleCopy(shareToken: string) {
    navigator.clipboard.writeText(getShareUrl(shareToken));
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Config</DialogTitle>
          <DialogDescription>
            Create a shareable link to your config. Anyone with the link can view it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center gap-2 rounded-md border border-border p-2">
              <Link className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                readOnly
                value={getShareUrl(share.shareToken)}
                className="h-8 text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="icon-sm" variant="outline" onClick={() => handleCopy(share.shareToken)}>
                {copiedToken === share.shareToken ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button size="icon-sm" variant="outline" onClick={() => onDeleteShare(share.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {shares.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No share links yet. Create one below.</p>
          )}
        </div>
        {isDirty && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes. Save your config before creating a share link.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {shares.length === 0 && (
            <Button onClick={onCreateShare} disabled={isCreating || isDirty}>
              {isCreating ? "Creating..." : "Create Link"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
