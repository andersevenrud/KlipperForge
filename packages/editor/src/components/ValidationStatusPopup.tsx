import type { ConfigSourceMap, SectionValidationError } from "@klipperforge/klipper-config";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo } from "react";
import { useEditorScroll } from "../context/editor-scroll-context";

interface ValidationStatusPopupProps {
  errors: SectionValidationError[];
  sourceMap: ConfigSourceMap;
  onNavigateToError?: (error: SectionValidationError) => void;
}

function formatErrorLocation(error: SectionValidationError): string {
  if (error.field) {
    return `[${error.section}] ${error.field}`;
  }
  return `[${error.section}]`;
}

export function ValidationStatusPopup({ errors, sourceMap, onNavigateToError }: ValidationStatusPopupProps) {
  const { scrollToSection, scrollToField, expandAndScrollToSection } = useEditorScroll();

  const { errorCount, warningCount, infoCount } = useMemo(() => {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    for (const error of errors) {
      switch (error.severity) {
        case "warning":
          warningCount++;
          break;
        case "info":
          infoCount++;
          break;
        default:
          errorCount++;
          break;
      }
    }
    return { errorCount, warningCount, infoCount };
  }, [errors]);

  const hasIssues = errorCount > 0 || warningCount > 0 || infoCount > 0;

  const handleErrorClick = (error: SectionValidationError) => {
    onNavigateToError?.(error);
    if (error.field) {
      scrollToField(error.section, error.field);
    } else {
      scrollToSection(error.section);
    }
    expandAndScrollToSection(error.section, error.field);
  };

  const badge = (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      {hasIssues ? (
        <>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="size-3.5 text-red-500" />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="size-3.5 text-amber-500" />
              {warningCount}
            </span>
          )}
          {infoCount > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <Info className="size-3.5 text-blue-500" />
              {infoCount}
            </span>
          )}
        </>
      ) : (
        <>
          <CheckCircle className="size-3.5 text-green-500" />
          <span className="text-green-400">Valid</span>
        </>
      )}
    </div>
  );

  if (!hasIssues) {
    return <div className="absolute right-3 bottom-3 z-50">{badge}</div>;
  }

  return (
    <div className="absolute right-3 bottom-3 z-50">
      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          <button type="button" className="cursor-pointer">
            {badge}
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side="top"
            align="end"
            sideOffset={8}
            className="z-50 max-h-64 w-80 overflow-y-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <div className="space-y-0.5 p-1">
              {errors.map((error) => {
                const key = `${error.section}::${error.field ?? ""}::${error.message}`;
                const isInfo = error.severity === "info";
                const isWarning = error.severity === "warning";

                const icon = isInfo ? (
                  <Info className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                ) : isWarning ? (
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                ) : (
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                );

                const messageColor = isInfo ? "text-blue-400" : isWarning ? "text-amber-400" : "text-red-400";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleErrorClick(error)}
                    className="flex w-full cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    {icon}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-muted-foreground">{formatErrorLocation(error)}</div>
                      <div className={messageColor}>{error.message}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
