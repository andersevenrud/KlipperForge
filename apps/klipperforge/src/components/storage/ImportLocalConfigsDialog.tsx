import type { ConfigSummary } from "@/api/config-storage-types";
import { clearLocalConfigs, readLocalConfigIndex, readLocalConfigRevision } from "@/api/local-storage-reader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConfigStorage } from "@/context/config-storage-context";
import { useConfigListQuery } from "@/hooks/use-queries";
import { featureFlags } from "@/lib/feature-flags";
import { Check, CircleAlert, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ImportLocalConfigsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ImportCandidate {
  id: string;
  name: string;
  editedName: string;
  currentRevision: number;
  updatedAt: string;
  hasNameCollision: boolean;
  selected: boolean;
}

interface ImportResult {
  id: string;
  name: string;
  status: "pending" | "importing" | "success" | "error";
  error?: string;
}

type DialogStep = "select" | "importing" | "done";

export function ImportLocalConfigsDialog({ open, onOpenChange, onImportComplete }: ImportLocalConfigsDialogProps) {
  const { adapter } = useConfigStorage();
  const configListQuery = useConfigListQuery(featureFlags.configStorage);

  const [step, setStep] = useState<DialogStep>("select");
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [cleaned, setCleaned] = useState(false);

  useEffect(
    function initCandidatesOnOpenEffect() {
      if (!open) return;

      const localConfigs = readLocalConfigIndex();
      const remoteNames = new Set((configListQuery.data?.configs ?? []).map((c: ConfigSummary) => c.name));

      setCandidates(
        localConfigs.map((c) => ({
          id: c.id,
          name: c.name,
          editedName: c.name,
          currentRevision: c.currentRevision,
          updatedAt: c.updatedAt,
          hasNameCollision: remoteNames.has(c.name),
          selected: true,
        })),
      );
      setStep("select");
      setResults([]);
      setImportProgress(0);
      setCleaned(false);
    },
    [open, configListQuery.data],
  );

  const handleToggle = useCallback((id: string) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  }, []);

  const handleToggleAll = useCallback(() => {
    setCandidates((prev) => {
      const allSelected = prev.every((c) => c.selected);
      return prev.map((c) => ({ ...c, selected: !allSelected }));
    });
  }, []);

  const handleNameChange = useCallback(
    (id: string, editedName: string) => {
      const remoteNames = new Set((configListQuery.data?.configs ?? []).map((c: ConfigSummary) => c.name));
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, editedName, hasNameCollision: remoteNames.has(editedName) } : c)),
      );
    },
    [configListQuery.data],
  );

  const selectedCount = useMemo(() => candidates.filter((c) => c.selected).length, [candidates]);

  const handleImport = useCallback(async () => {
    const selected = candidates.filter((c) => c.selected);
    const initialResults: ImportResult[] = selected.map((c) => ({
      id: c.id,
      name: c.editedName,
      status: "pending",
    }));
    setResults(initialResults);
    setStep("importing");
    setImportProgress(0);

    const finalResults = [...initialResults];

    for (let i = 0; i < selected.length; i++) {
      const candidate = selected[i];
      finalResults[i] = { ...finalResults[i], status: "importing" };
      setResults([...finalResults]);
      setImportProgress(i + 1);

      try {
        const revision = readLocalConfigRevision(candidate.id, candidate.currentRevision);
        if (!revision) {
          throw new Error("Revision data not found in local storage");
        }
        await adapter.createConfig(candidate.editedName, revision.document, "Imported from local storage");
        finalResults[i] = { ...finalResults[i], status: "success" };
      } catch (err) {
        finalResults[i] = {
          ...finalResults[i],
          status: "error",
          error: err instanceof Error ? err.message : "Import failed",
        };
      }

      setResults([...finalResults]);
    }

    setStep("done");
    onImportComplete();
  }, [candidates, adapter, onImportComplete]);

  const successCount = useMemo(() => results.filter((r) => r.status === "success").length, [results]);
  const errorCount = useMemo(() => results.filter((r) => r.status === "error").length, [results]);

  const handleCleanup = useCallback(() => {
    const successIds = results.filter((r) => r.status === "success").map((r) => r.id);
    clearLocalConfigs(successIds);
    setCleaned(true);
    onImportComplete();
  }, [results, onImportComplete]);

  return (
    <Dialog open={open} onOpenChange={step === "importing" ? undefined : onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from local storage</DialogTitle>
          <DialogDescription>
            {step === "select" && "Select configs to import into your cloud storage."}
            {step === "importing" && `Importing ${importProgress} of ${results.length}...`}
            {step === "done" &&
              (errorCount > 0
                ? `${successCount} of ${results.length} configs imported. ${errorCount} failed.`
                : `${successCount} config${successCount !== 1 ? "s" : ""} imported successfully.`)}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <>
            {candidates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No local configs found.</p>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id="select-all-local-configs"
                      checked={candidates.every((c) => c.selected)}
                      onCheckedChange={handleToggleAll}
                    />
                    <label htmlFor="select-all-local-configs" className="cursor-pointer">
                      Select all
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
                </div>
                <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                  {candidates.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 rounded-md border border-border p-3">
                      <Checkbox checked={c.selected} onCheckedChange={() => handleToggle(c.id)} className="mt-1" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Input
                            value={c.editedName}
                            onChange={(e) => handleNameChange(c.id, e.target.value)}
                            className="h-7 text-sm"
                          />
                          {c.hasNameCollision && (
                            <span title="A remote config with this name already exists">
                              <TriangleAlert className="h-4 w-4 shrink-0 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Rev {c.currentRevision} &middot; {new Date(c.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                Import selected ({selectedCount})
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Importing {importProgress} of {results.length}...
            </p>
          </div>
        )}

        {step === "done" && (
          <>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  {r.status === "success" && <Check className="h-4 w-4 shrink-0 text-green-500" />}
                  {r.status === "error" && <CircleAlert className="h-4 w-4 shrink-0 text-red-500" />}
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  {r.error && <span className="shrink-0 text-xs text-red-500">{r.error}</span>}
                </div>
              ))}
            </div>
            <DialogFooter>
              {successCount > 0 && !cleaned && (
                <Button variant="outline" onClick={handleCleanup}>
                  Clean up local copies
                </Button>
              )}
              {cleaned && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  Local copies removed
                </span>
              )}
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
