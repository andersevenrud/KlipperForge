import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface RemoveConfirmButtonProps {
  onConfirm: () => void;
}

export function RemoveConfirmButton({ onConfirm }: RemoveConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:h-6 md:w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onConfirm}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:h-6 md:w-6 hover:bg-muted"
          onClick={() => setConfirming(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 md:h-6 md:w-6 shrink-0 text-muted-foreground hover:text-destructive"
      onClick={() => setConfirming(true)}
    >
      <X className="h-3 w-3" />
    </Button>
  );
}
