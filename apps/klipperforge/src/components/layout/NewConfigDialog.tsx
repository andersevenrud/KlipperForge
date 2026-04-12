import { useEditorScroll } from "@klipperforge/editor";
import type { ConfigDocument } from "@klipperforge/klipper-config";
import type { PrinterPreset } from "@klipperforge/printer-data";
import { resolvePresetVariant } from "@klipperforge/printer-data";
import { FilePlus, Loader2 } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import { PrinterSelect } from "@/components/sections/PrinterSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@/context/config-context";
import { useStorage } from "@/context/storage-context";
import { clearDraft } from "@/lib/draft-storage";
import { useConfirmDiscard } from "./ConfirmDiscardDialog";

interface NewConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PresetSelection {
  preset: PrinterPreset;
  variantId?: string;
}

const BLANK_DOCUMENT: ConfigDocument = {
  sections: [
    { definitionId: "printer", data: { kinematics: "cartesian" } },
    { definitionId: "mcu", data: {} },
  ],
};

export function NewConfigDialog({ open, onOpenChange }: NewConfigDialogProps) {
  const { dispatch } = useConfig();
  const storage = useStorage();
  const { scrollToTop } = useEditorScroll();
  const { confirmDiscardIfDirty } = useConfirmDiscard();
  const [selection, setSelection] = useState<PresetSelection | null>(null);

  const handleSelectionChange = useCallback((sel: PresetSelection | null) => {
    setSelection(sel);
  }, []);

  function apply() {
    storage.clear();
    clearDraft();
    scrollToTop();
    onOpenChange(false);
    setSelection(null);
  }

  async function handleBlankConfig() {
    if (!(await confirmDiscardIfDirty())) return;
    dispatch({ type: "LOAD_DOCUMENT", payload: { document: BLANK_DOCUMENT } });
    apply();
  }

  async function handleCreatePreset() {
    if (!selection) return;
    if (!(await confirmDiscardIfDirty())) return;
    const resolved = resolvePresetVariant(selection.preset, selection.variantId);
    const id = selection.variantId ? `${selection.preset.id}:${selection.variantId}` : selection.preset.id;
    dispatch({
      type: "SET_PRESET",
      payload: {
        sections: resolved.defaults.sections,
        presetId: id,
        mcuBoards: resolved.defaults.mcuBoards,
      },
    });
    apply();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Configuration</DialogTitle>
        </DialogHeader>
        <Button variant="outline" className="justify-start" onClick={handleBlankConfig}>
          <FilePlus className="mr-2 h-4 w-4" />
          Blank Configuration
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or select a preset</span>
          <Separator className="flex-1" />
        </div>
        <Suspense fallback={<Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />}>
          <PrinterSelect onSelectionChange={handleSelectionChange} />
        </Suspense>
        <DialogFooter>
          <Button onClick={handleCreatePreset} disabled={!selection}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
