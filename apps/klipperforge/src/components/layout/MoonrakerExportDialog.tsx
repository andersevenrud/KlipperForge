import {
  fetchFileList,
  getMoonrakerErrorMessage,
  type MoonrakerConnectionOptions,
  normalizeUrl,
  uploadFile,
} from "@klipperforge/moonraker";
import { ArrowLeft, Check, CircleAlert, Loader2, TriangleAlert } from "lucide-react";
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

interface MoonrakerExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: Map<string, string>;
}

interface UploadError {
  name: string;
  error: string;
}

type DialogStep = "connect" | "confirm" | "uploading" | "done";

const STORAGE_KEY_URL = "klipperforge:moonraker-url";
const STORAGE_KEY_API_KEY = "klipperforge:moonraker-api-key";

export function MoonrakerExportDialog({ open, onOpenChange, files }: MoonrakerExportDialogProps) {
  const [step, setStep] = useState<DialogStep>("connect");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [existingFiles, setExistingFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(
    function loadStoredValuesEffect() {
      if (open) {
        setUrl(localStorage.getItem(STORAGE_KEY_URL) ?? "");
        setApiKey(localStorage.getItem(STORAGE_KEY_API_KEY) ?? "");
        setStep("connect");
        setConnectionError(null);
        setExistingFiles(new Set());
        setSelectedFiles(new Set());
        setUploadProgress(0);
        setUploadTotal(0);
        setUploadErrors([]);
        setUploadedFiles([]);
      }
    },
    [open],
  );

  const handleConnect = useCallback(async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const options: MoonrakerConnectionOptions = {
        baseUrl: normalized,
        apiKey: apiKey || undefined,
      };

      const fileList = await fetchFileList(options);
      const existing = new Set(fileList.map((f) => f.path));

      localStorage.setItem(STORAGE_KEY_URL, url);
      if (apiKey) {
        localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_KEY);
      }

      setExistingFiles(existing);
      setSelectedFiles(new Set(files.keys()));
      setStep("confirm");
    } catch (err) {
      setConnectionError(getMoonrakerErrorMessage(err));
    } finally {
      setIsConnecting(false);
    }
  }, [url, apiKey, files]);

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

  const allSelected = files.size > 0 && selectedFiles.size === files.size;

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(new Set(files.keys()));
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const handleUpload = useCallback(async () => {
    const normalized = normalizeUrl(url);
    const options: MoonrakerConnectionOptions = {
      baseUrl: normalized,
      apiKey: apiKey || undefined,
    };

    const filesToUpload = Array.from(files.entries()).filter(([name]) => selectedFiles.has(name));
    setUploadTotal(filesToUpload.length);
    setUploadProgress(0);
    setUploadErrors([]);
    setUploadedFiles([]);
    setStep("uploading");

    const errors: UploadError[] = [];
    const uploaded: string[] = [];

    for (const [name, content] of filesToUpload) {
      try {
        await uploadFile(options, name, content);
        uploaded.push(name);
      } catch (err) {
        errors.push({ name, error: getMoonrakerErrorMessage(err) });
      }
      setUploadProgress(uploaded.length + errors.length);
      setUploadedFiles([...uploaded]);
      setUploadErrors([...errors]);
    }

    setStep("done");
  }, [url, apiKey, files, selectedFiles]);

  const fileEntries = Array.from(files.keys());
  const overwriteCount = fileEntries.filter((f) => selectedFiles.has(f) && existingFiles.has(f)).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (step === "uploading") return;
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "connect" && "Export to Moonraker"}
            {step === "confirm" && "Confirm Upload"}
            {step === "uploading" && "Uploading..."}
            {step === "done" && "Upload Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "connect" && "Connect to your Moonraker instance to upload configuration files."}
            {step === "confirm" &&
              `${files.size} file${files.size === 1 ? "" : "s"} ready to upload. Select which files to send.`}
            {step === "uploading" && `Uploading ${uploadProgress} of ${uploadTotal}...`}
            {step === "done" &&
              (uploadErrors.length === 0
                ? `Successfully uploaded ${uploadedFiles.length} file${uploadedFiles.length === 1 ? "" : "s"}.`
                : `Uploaded ${uploadedFiles.length} of ${uploadTotal} file${uploadTotal === 1 ? "" : "s"}.`)}
          </DialogDescription>
        </DialogHeader>

        {step === "connect" && (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="export-moonraker-url">Moonraker URL</Label>
              <Input
                id="export-moonraker-url"
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
                <Label htmlFor="export-moonraker-api-key">API Key (optional)</Label>
                <Input
                  id="export-moonraker-api-key"
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

            {connectionError && (
              <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{connectionError}</span>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="grid gap-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedFiles.size} of {files.size} selected
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
              {fileEntries.map((name) => {
                const willOverwrite = existingFiles.has(name);
                return (
                  <div
                    key={name}
                    className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                  >
                    <Checkbox checked={selectedFiles.has(name)} onCheckedChange={() => handleToggleFile(name)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{name}</div>
                      {willOverwrite && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <TriangleAlert className="h-3 w-3" />
                          Exists on printer — will overwrite
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {overwriteCount > 0 && selectedFiles.size > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                {overwriteCount} file{overwriteCount === 1 ? "" : "s"} will be overwritten on the printer.
              </div>
            )}
          </div>
        )}

        {step === "uploading" && (
          <div className="grid gap-3 py-4">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${uploadTotal > 0 ? (uploadProgress / uploadTotal) * 100 : 0}%` }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Uploading {uploadProgress} of {uploadTotal}...
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="grid gap-3 py-2">
            {uploadErrors.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                <Check className="h-4 w-4 shrink-0" />
                All files uploaded successfully.
              </div>
            ) : (
              <div className="grid gap-2">
                {uploadedFiles.length > 0 && (
                  <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                    <Check className="h-4 w-4 shrink-0" />
                    {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"} uploaded successfully.
                  </div>
                )}
                <div className="rounded-md bg-destructive/10 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <CircleAlert className="h-4 w-4" />
                    Failed uploads
                  </div>
                  <ul className="space-y-1">
                    {uploadErrors.map((err) => (
                      <li key={err.name} className="text-xs text-destructive">
                        {err.name}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
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

          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={() => setStep("connect")} className="mr-auto">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleUpload} disabled={selectedFiles.size === 0}>
                Upload {selectedFiles.size} file{selectedFiles.size === 1 ? "" : "s"}
              </Button>
            </>
          )}

          {step === "done" && <Button onClick={() => onOpenChange(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
