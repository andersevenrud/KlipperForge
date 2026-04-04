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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { HardDrive } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface SaveConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, comment?: string) => Promise<void>;
  defaultName?: string;
  isSaving: boolean;
  configCount: number;
  maxConfigs: number;
  storageMode: "local" | "remote";
  onSignIn?: () => void;
}

const saveConfigSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  comment: z.string(),
});

type SaveConfigFormValues = z.infer<typeof saveConfigSchema>;

export function SaveConfigDialog({
  open,
  onOpenChange,
  onSave,
  defaultName,
  isSaving,
  configCount,
  maxConfigs,
  storageMode,
  onSignIn,
}: SaveConfigDialogProps) {
  const limitReached = configCount >= maxConfigs;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<SaveConfigFormValues>({
    resolver: zodResolver(saveConfigSchema),
    mode: "onChange",
    defaultValues: { name: defaultName ?? "", comment: "" },
  });

  useEffect(
    function syncDefaultsEffect() {
      if (open) {
        reset({ name: defaultName ?? "", comment: "" });
      }
    },
    [open, defaultName, reset],
  );

  const onValid = useCallback(
    async (data: SaveConfigFormValues) => {
      try {
        await onSave(data.name, data.comment?.trim() || undefined);
        reset({ name: "", comment: "" });
      } catch (err) {
        setError("root", {
          message: err instanceof Error ? err.message : "Failed to save",
        });
      }
    },
    [onSave, reset, setError],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset({ name: defaultName ?? "", comment: "" });
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset, defaultName],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Config</DialogTitle>
          <DialogDescription>
            {storageMode === "local"
              ? `Saving to this browser's local storage. ${configCount} of ${maxConfigs} configs used.`
              : `Save your configuration to your account. ${configCount} of ${maxConfigs} configs used.`}
            {limitReached && " Delete an existing config to save a new one."}
          </DialogDescription>
        </DialogHeader>
        {storageMode === "local" && onSignIn && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            <span>
              Configs are stored in this browser only.{" "}
              <button
                type="button"
                onClick={onSignIn}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Sign in
              </button>{" "}
              to sync across devices.
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit(onValid)} className="contents">
          <div className="space-y-4">
            <FieldWrapper name="Name" required error={errors.name?.message}>
              {({ id }) => <Input id={id} placeholder="My Printer Config" {...register("name")} />}
            </FieldWrapper>
            <FieldWrapper name="Comment (optional)">
              {({ id }) => (
                <Textarea id={id} placeholder="What changed..." className="min-h-[80px]" {...register("comment")} />
              )}
            </FieldWrapper>
            {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSaving || limitReached}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
