import type { FlashPhase, FlashProgress as FlashProgressType } from "@klipperforge/dfu";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashProgressProps {
  progress: FlashProgressType;
  onCancel: () => void;
  onRetry?: () => void;
}

const PHASE_LABELS: Record<FlashPhase, string> = {
  connecting: "Connecting",
  erasing: "Erasing",
  writing: "Writing",
  verifying: "Verifying",
  complete: "Complete",
  error: "Error",
};

const PHASE_ORDER: FlashPhase[] = ["connecting", "erasing", "writing", "verifying", "complete"];

export function FlashProgress({ progress, onCancel, onRetry }: FlashProgressProps) {
  const isComplete = progress.phase === "complete";
  const isError = progress.phase === "error";
  const isIndeterminate = progress.phase === "connecting" || progress.phase === "erasing";

  return (
    <div className="space-y-4">
      {/* Phase steps */}
      <div className="flex items-center gap-1">
        {PHASE_ORDER.map((phase) => {
          const phaseIndex = PHASE_ORDER.indexOf(phase);
          const currentIndex = PHASE_ORDER.indexOf(progress.phase);
          const isActive = phase === progress.phase;
          const isDone = phaseIndex < currentIndex || isComplete;

          return (
            <div key={phase} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1 w-full rounded-full ${
                  isDone ? "bg-green-500" : isActive ? (isError ? "bg-destructive" : "bg-primary") : "bg-muted"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? (isError ? "text-destructive" : "font-medium text-foreground") : "text-muted-foreground"
                }`}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {!isComplete && !isError && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            {isIndeterminate ? (
              <div className="animate-indeterminate-progress h-full w-1/3 rounded-full bg-primary" />
            ) : (
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{progress.message}</p>
        </div>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <CheckCircle className="size-4" />
          <span>{progress.message}</span>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            <span>{progress.message}</span>
          </div>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Cancel button */}
      {!isComplete && !isError && (
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="size-4" />
          Cancel
        </Button>
      )}
    </div>
  );
}
