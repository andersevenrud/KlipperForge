import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";

interface NamePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionLabel: string;
  existingHeaders: Set<string>;
  prefix: string;
  separator: string;
  onConfirm: (name: string) => void;
  stepperNames?: string[];
  namePattern?: RegExp;
  namePatternMessage?: string;
  initialName?: string;
  confirmLabel?: string;
  title?: string;
}

function createNamePromptSchema(
  namePattern: RegExp | undefined,
  namePatternMessage: string | undefined,
  existingHeaders: Set<string>,
  prefix: string,
  separator: string,
) {
  const pattern = namePattern ?? /^[a-zA-Z0-9_]+$/;
  const patternMessage = namePatternMessage ?? "Only letters, numbers, and underscores";

  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .regex(pattern, patternMessage)
      .refine(
        (value) => !existingHeaders.has(`${prefix}${separator}${value}`),
        "A section with this name already exists",
      ),
  });
}

interface NamePromptFormValues {
  name: string;
}

export function NamePromptDialog({
  open,
  onOpenChange,
  sectionLabel,
  existingHeaders,
  prefix,
  separator,
  onConfirm,
  stepperNames,
  namePattern,
  namePatternMessage,
  initialName,
  confirmLabel,
  title,
}: NamePromptDialogProps) {
  const schema = useMemo(
    () => createNamePromptSchema(namePattern, namePatternMessage, existingHeaders, prefix, separator),
    [namePattern, namePatternMessage, existingHeaders, prefix, separator],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NamePromptFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: initialName ?? "" },
  });

  useEffect(
    function syncInitialNameEffect() {
      if (open) {
        reset({ name: initialName ?? "" });
      }
    },
    [open, initialName, reset],
  );

  const isTmc = prefix.startsWith("tmc");
  const currentName = watch("name");

  const onValid = useCallback(
    (data: NamePromptFormValues) => {
      onConfirm(data.name);
      reset({ name: initialName ?? "" });
      onOpenChange(false);
    },
    [onConfirm, onOpenChange, reset, initialName],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset({ name: initialName ?? "" });
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset, initialName],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? `Add ${sectionLabel}`}</DialogTitle>
          <DialogDescription>
            Enter a name for this section instance. The resulting header will be [{prefix}
            {separator}
            {currentName || "..."}].
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="contents">
          <div className="flex flex-col gap-2">
            {isTmc && stepperNames && stepperNames.length > 0 && (
              <div className="flex flex-col gap-1">
                <FieldWrapper name="Select a stepper">
                  {() => (
                    <div className="flex flex-wrap gap-1">
                      {stepperNames.map((sn) => (
                        <Button
                          key={sn}
                          type="button"
                          variant={currentName === sn ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setValue("name", sn, { shouldValidate: true })}
                        >
                          {sn}
                        </Button>
                      ))}
                    </div>
                  )}
                </FieldWrapper>
              </div>
            )}
            <FieldWrapper name="Instance name" required error={errors.name?.message}>
              {({ id }) => <Input id={id} {...register("name")} placeholder="e.g. hotend_fan" autoFocus />}
            </FieldWrapper>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{confirmLabel ?? "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
