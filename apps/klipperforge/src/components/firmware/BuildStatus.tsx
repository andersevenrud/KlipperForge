import type { BuildStatusResponse } from "@/api/firmware-types";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Download, Loader2, Usb } from "lucide-react";

interface BuildStatusProps {
  status: BuildStatusResponse;
  onDownload: () => void;
  onFlash?: () => void;
  downloading: boolean;
  flashSupported?: boolean;
}

export function BuildStatus({ status, onDownload, onFlash, downloading, flashSupported }: BuildStatusProps) {
  switch (status.status) {
    case "queued":
      return (
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Queued</p>
            <p className="text-xs text-muted-foreground">Waiting for available build slot...</p>
          </div>
        </div>
      );
    case "building":
      return (
        <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Building firmware</p>
            <p className="text-xs text-muted-foreground">{status.progress ?? "Compiling..."}</p>
          </div>
        </div>
      );
    case "completed":
      return (
        <div className="flex items-center justify-between rounded-md border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="size-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Build complete</p>
              <p className="text-xs text-muted-foreground">
                {status.cached ? "Served from cache" : "Firmware compiled successfully"}
              </p>
            </div>
          </div>
          {status.downloadReady && (
            <div className="flex gap-2">
              <Button size="sm" onClick={onDownload} disabled={downloading}>
                {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Download
              </Button>
              {flashSupported && onFlash && (
                <Button size="sm" variant="outline" onClick={onFlash}>
                  <Usb className="size-4" />
                  Flash to Device
                </Button>
              )}
            </div>
          )}
        </div>
      );
    case "failed":
      return (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="text-sm font-medium">Build failed</p>
              <p className="text-xs text-muted-foreground">{status.error ?? "Unknown error occurred"}</p>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
