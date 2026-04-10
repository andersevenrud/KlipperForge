import { NotFoundError } from "@klipperforge/printer-data";
import { FileQuestion } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// NotFound — shared 404 view
// ---------------------------------------------------------------------------

interface NotFoundProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function NotFound({ title = "Not found", description, actionLabel, onAction }: NotFoundProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <FileQuestion className="text-muted-foreground size-12" />
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-muted-foreground max-w-md text-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotFoundBoundary — catches NotFoundError only, rethrows others
// ---------------------------------------------------------------------------

interface NotFoundBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  /**
   * When this value changes, the boundary resets its error state. Use a
   * value that uniquely identifies the current request (e.g. an item id
   * or query param) so navigating away from a broken URL recovers the
   * view automatically.
   */
  resetKey?: unknown;
}

interface NotFoundBoundaryState {
  error: Error | null;
}

/**
 * React error boundary that handles only `NotFoundError` thrown by data
 * loaders in `@klipperforge/printer-data`. Any other error is re-thrown
 * from `render()` so the app-level `ErrorBoundary` can handle real
 * crashes normally.
 */
export class NotFoundBoundary extends Component<NotFoundBoundaryProps, NotFoundBoundaryState> {
  constructor(props: NotFoundBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): NotFoundBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (error instanceof NotFoundError) {
      console.warn("NotFound:", error.path, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: NotFoundBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      if (error instanceof NotFoundError) {
        return this.props.fallback;
      }
      // Bubble non-404 errors to the outer ErrorBoundary.
      throw error;
    }
    return this.props.children;
  }
}
