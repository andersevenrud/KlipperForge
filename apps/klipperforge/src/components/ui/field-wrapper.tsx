import type { ActiveOverride } from "@klipperforge/klipper-config";
import { ArrowRightLeft, CircleEqual, CircleHelp, TriangleAlert } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface FieldChildProps {
  id: string;
  disabled?: boolean;
}

interface FieldWrapperProps {
  name: string;
  id?: string;
  inline?: boolean;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
  validationError?: string;
  warning?: string;
  hint?: string;
  matchesDefault?: boolean;
  override?: ActiveOverride;
  children: (props: FieldChildProps) => ReactNode;
}

interface FieldOverridePopoverProps {
  override: ActiveOverride;
}

interface FieldHelpPopoverProps {
  description: string;
}

export function FieldWrapper({
  name,
  id,
  inline,
  disabled,
  required,
  description,
  error,
  validationError,
  warning,
  hint,
  matchesDefault,
  override,
  children,
}: FieldWrapperProps) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  if (inline) {
    return (
      <span className="flex items-center gap-2">
        {children({ id: resolvedId, disabled })}
        <Label htmlFor={resolvedId} className="text-xs font-normal">
          {name}
        </Label>
      </span>
    );
  }

  return (
    <>
      <span className="flex items-center gap-1">
        <Label htmlFor={resolvedId} className="text-xs font-normal">
          {name}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {description && <FieldHelpPopover description={description} />}
      </span>
      {children({ id: resolvedId, disabled })}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {validationError && <p className="text-xs text-destructive">{validationError}</p>}
      {warning && (
        <p className="flex items-center gap-1 text-xs text-yellow-500">
          <TriangleAlert className="h-3 w-3 shrink-0" />
          {warning}
        </p>
      )}
      {matchesDefault && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CircleEqual className="h-3 w-3 shrink-0" />
          Matches default
        </p>
      )}
      {override && (
        <p className="flex items-center gap-1 text-xs text-blue-400">
          <FieldOverridePopover override={override} />
          Overridden by {override.sourceHeader.startsWith("#*#") ? "SAVE_CONFIG" : override.sourceHeader} →{" "}
          {String(override.overriddenValue)}
        </p>
      )}
    </>
  );
}

export function FieldOverridePopover({ override }: FieldOverridePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex text-blue-400 hover:text-blue-300">
          <ArrowRightLeft className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 p-3">
        <div className="flex flex-col gap-1.5 text-xs">
          <p className="font-medium">
            Overridden by {override.sourceHeader.startsWith("#*#") ? "SAVE_CONFIG" : `[${override.sourceHeader}]`}
          </p>
          <p>
            <span className="text-muted-foreground">Original:</span>{" "}
            {override.originalValue !== undefined ? (
              String(override.originalValue)
            ) : (
              <span className="italic text-muted-foreground">not set</span>
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Output:</span> {String(override.overriddenValue)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FieldHelpPopover({ description }: FieldHelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground hover:text-foreground">
          <CircleHelp className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 p-3">
        <p className="text-xs leading-relaxed">{description}</p>
      </PopoverContent>
    </Popover>
  );
}
