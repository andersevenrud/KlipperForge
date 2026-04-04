import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

const STORAGE_KEY = "klipperforge:wip-banner:dismissed";

export function WipBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  if (dismissed) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-muted px-4 py-2 text-sm">
      <p>
        This project is a work in progress.{" "}
        <a
          href="https://github.com/andersevenrud/KlipperForge"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          View on GitHub
        </a>
      </p>
      <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={handleDismiss}>
        <X className="size-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
