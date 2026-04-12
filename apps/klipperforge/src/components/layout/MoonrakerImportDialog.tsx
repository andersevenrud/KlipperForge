import {
  fetchFile,
  fetchFileList,
  type IncludeError,
  type ResolvedFile,
  resolveIncludes,
} from "@klipperforge/moonraker";
import { ArrowLeft, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useMoonrakerConnection } from "@/hooks/use-moonraker-connection";

interface MoonrakerImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (files: { name: string; content: string }[]) => void;
}

type DialogStep = "connect" | "select";

export function MoonrakerImportDialog({ open, onOpenChange, onImport }: MoonrakerImportDialogProps) {
  const { url, setUrl, apiKey, setApiKey, showApiKey, setShowApiKey, isConnecting, connectionError, reset, connect } =
    useMoonrakerConnection();
  const [step, setStep] = useState<DialogStep>("connect");
  const [rootFile, setRootFile] = useState("printer.cfg");
  const [resolvedFiles, setResolvedFiles] = useState<ResolvedFile[]>([]);
  const [resolveErrors, setResolveErrors] = useState<IncludeError[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(
    function loadStoredValuesEffect() {
      if (open) {
        reset();
        setStep("connect");
        setResolvedFiles([]);
        setResolveErrors([]);
        setSelectedFiles(new Set());
      }
    },
    [open, reset],
  );

  const handleConnect = useCallback(async () => {
    await connect(async (options) => {
      const fileList = await fetchFileList(options);
      const availablePaths = fileList.map((f) => f.path);

      if (!availablePaths.includes(rootFile)) {
        const cfgFiles = availablePaths.filter((p) => p.endsWith(".cfg"));
        throw new Error(
          `Could not find "${rootFile}" in the config directory. ` +
            `Available .cfg files: ${cfgFiles.slice(0, 5).join(", ")}${cfgFiles.length > 5 ? "..." : ""}`,
        );
      }

      const rootContent = await fetchFile(options, rootFile);
      const result = await resolveIncludes(rootFile, rootContent, availablePaths, (path) => fetchFile(options, path));

      setResolvedFiles(result.files);
      setResolveErrors(result.errors);
      setSelectedFiles(new Set(result.files.map((f) => f.path)));
      setStep("select");
    });
  }, [connect, rootFile]);

  const handleToggleFile = useCallback((path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(new Set(resolvedFiles.map((f) => f.path)));
  }, [resolvedFiles]);

  const handleDeselectAll = useCallback(() => {
    const rootPath = resolvedFiles[0]?.path;
    setSelectedFiles(rootPath ? new Set([rootPath]) : new Set());
  }, [resolvedFiles]);

  const handleImport = useCallback(() => {
    const filesToImport = resolvedFiles
      .filter((f) => selectedFiles.has(f.path))
      .map((f) => ({ name: f.path, content: f.content }));
    onImport(filesToImport);
  }, [resolvedFiles, selectedFiles, onImport]);

  const allSelected = resolvedFiles.length > 0 && selectedFiles.size === resolvedFiles.length;
  const rootPath = resolvedFiles[0]?.path;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === "connect" ? "Import from Moonraker" : "Select Config Files"}</DialogTitle>
          <DialogDescription>
            {step === "connect"
              ? "Connect to your Moonraker instance to import configuration files."
              : `Found ${resolvedFiles.length} config file${resolvedFiles.length === 1 ? "" : "s"}. Select which files to import.`}
          </DialogDescription>
        </DialogHeader>

        {step === "connect" && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="moonraker-url">Moonraker URL</Label>
              <Input
                id="moonraker-url"
                placeholder="http://192.168.1.100:7125"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConnect();
                }}
                disabled={isConnecting}
              />
            </div>

            {showApiKey ? (
              <div className="grid gap-2">
                <Label htmlFor="moonraker-api-key">API Key (optional)</Label>
                <Input
                  id="moonraker-api-key"
                  type="password"
                  placeholder="Enter API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isConnecting}
                />
              </div>
            ) : (
              <button
                type="button"
                className="text-left text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowApiKey(true)}
              >
                + Add API key
              </button>
            )}

            <div className="grid gap-2">
              <Label htmlFor="moonraker-root-file">Root config file</Label>
              <Input
                id="moonraker-root-file"
                placeholder="printer.cfg"
                value={rootFile}
                onChange={(e) => setRootFile(e.target.value)}
                disabled={isConnecting}
              />
            </div>

            {connectionError && (
              <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{connectionError}</span>
              </div>
            )}
          </div>
        )}

        {step === "select" && (
          <div className="grid gap-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.size} of {resolvedFiles.length} selected
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={allSelected ? handleDeselectAll : handleSelectAll}
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {resolvedFiles.map((file) => {
                const isRoot = file.path === rootPath;
                return (
                  <div
                    key={file.path}
                    className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedFiles.has(file.path)}
                      onCheckedChange={() => handleToggleFile(file.path)}
                      disabled={isRoot}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{file.path}</div>
                      {file.includedBy && (
                        <div className="truncate text-xs text-muted-foreground">included by {file.includedBy}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {resolveErrors.length > 0 && (
              <div className="rounded-md bg-amber-500/10 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <TriangleAlert className="h-4 w-4" />
                  Include warnings
                </div>
                <ul className="space-y-1">
                  {resolveErrors.map((err) => (
                    <li
                      key={`${err.referencedIn}:${err.includePath}`}
                      className="text-xs text-amber-700 dark:text-amber-300"
                    >
                      {err.message}
                      <span className="text-amber-600/70 dark:text-amber-400/70"> (in {err.referencedIn})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "connect" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConnecting}>
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting || !url.trim()}>
                {isConnecting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            </>
          )}

          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => setStep("connect")} className="mr-auto">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedFiles.size === 0}>
                Import {selectedFiles.size} file{selectedFiles.size === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
