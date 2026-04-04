import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className = "h-full" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="text-muted-foreground size-6 animate-spin" />
    </div>
  );
}
