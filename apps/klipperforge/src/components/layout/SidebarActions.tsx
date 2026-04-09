import { useEditorScroll } from "@klipperforge/editor";
import {
  cfgToDocument,
  defaultRegistry,
  exportProject,
  type ImportWarning,
  importProject,
  parseKlipperConfig,
  parseMultiFileConfigs,
} from "@klipperforge/klipper-config";
import { useQueryClient } from "@tanstack/react-query";
import { zipSync } from "fflate";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Clock,
  Download,
  File,
  FileArchive,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Info,
  Link,
  Save,
  Server,
  Share,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import type { RevisionSummary, ShareInfo } from "@/api/config-storage-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useConfig } from "@/context/config-context";
import { useConfigStorage } from "@/context/config-storage-context";
import { useStorage } from "@/context/storage-context";
import { useLocalConfigDetection } from "@/hooks/use-local-config-detection";
import { useConfigListQuery } from "@/hooks/use-queries";
import { featureFlags } from "@/lib/feature-flags";
import { downloadBlob } from "@/lib/utils";
import { ConfigListDialog } from "../storage/ConfigListDialog";
import { ImportLocalConfigsDialog } from "../storage/ImportLocalConfigsDialog";
import { RevisionHistoryDialog } from "../storage/RevisionHistoryDialog";
import { SaveConfigDialog } from "../storage/SaveConfigDialog";
import { ShareDialog } from "../storage/ShareDialog";
import { MoonrakerExportDialog } from "./MoonrakerExportDialog";
import { MoonrakerImportDialog } from "./MoonrakerImportDialog";
import { NewConfigDialog } from "./NewConfigDialog";

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function stripTopFolder(relativePath: string): string {
  const parts = relativePath.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : parts[0];
}

interface ImportWarningsDialogProps {
  warnings: ImportWarning[];
  onClose: () => void;
}

function ImportWarningsDialog({ warnings, onClose }: ImportWarningsDialogProps) {
  const errors = warnings.filter((w) => !w.autoFixed && w.severity === "error");
  const warningItems = warnings.filter((w) => !w.autoFixed && w.severity !== "error");
  const autoFixed = warnings.filter((w) => w.autoFixed);
  const hasErrors = errors.length > 0;

  const parts: string[] = [];
  if (errors.length > 0) parts.push(`${errors.length} error${errors.length !== 1 ? "s" : ""}`);
  if (warningItems.length > 0) parts.push(`${warningItems.length} warning${warningItems.length !== 1 ? "s" : ""}`);
  if (autoFixed.length > 0) parts.push(`${autoFixed.length} auto-fixed`);
  const description = `${parts.join(" and ")} found during import.`;

  return (
    <Dialog open={warnings.length > 0} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <CircleAlert className="h-5 w-5 text-red-500" />
            ) : (
              <TriangleAlert className="h-5 w-5 text-amber-500" />
            )}
            Import results
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {errors.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                <CircleAlert className="h-3 w-3" />
                Errors
              </p>
              {errors.map((w) => (
                <div
                  key={`${w.file ?? ""}:${w.line}:${w.message}`}
                  className="rounded-md border border-red-500/30 bg-red-500/5 p-2 text-sm"
                >
                  <p className="text-muted-foreground">
                    {w.file ? `${w.file}:` : ""}
                    {w.line > 0 ? `line ${w.line}` : ""}
                  </p>
                  <p className="text-red-700 dark:text-red-300">{w.message}</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{w.raw}</pre>
                </div>
              ))}
            </div>
          )}
          {warningItems.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                <TriangleAlert className="h-3 w-3" />
                Warnings
              </p>
              {warningItems.map((w) => (
                <div
                  key={`${w.file ?? ""}:${w.line}:${w.message}`}
                  className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-sm"
                >
                  <p className="text-muted-foreground">
                    {w.file ? `${w.file}:` : ""}
                    {w.line > 0 ? `line ${w.line}` : ""}
                  </p>
                  <p>{w.message}</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{w.raw}</pre>
                </div>
              ))}
            </div>
          )}
          {autoFixed.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                <Info className="h-3 w-3" />
                Auto-fixed
              </p>
              {autoFixed.map((w) => (
                <div
                  key={`${w.file ?? ""}:${w.line}:${w.message}`}
                  className="rounded-md border border-blue-500/30 bg-blue-500/5 p-2 text-sm"
                >
                  <p>{w.message}</p>
                  <pre className="mt-1 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{w.raw}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function StorageStatusBar() {
  const { state } = useStorage();
  const { adapter } = useConfigStorage();

  if (!state.configId) return null;

  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
      {adapter.mode === "local" && (
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">Local</span>
      )}
      <span className="truncate font-medium">{state.configName ?? "Untitled"}</span>
      <span className="text-muted-foreground/60">&middot;</span>
      <span>Rev {state.currentRevision}</span>
      <span className="text-muted-foreground/60">&middot;</span>
      <span className={state.saveStatus === "error" ? "text-red-500" : undefined}>
        {state.saveStatus === "saving"
          ? "Saving..."
          : state.saveStatus === "error"
            ? "Save failed"
            : state.isDirty
              ? "Modified"
              : "Saved"}
      </span>
    </div>
  );
}

function StorageActions() {
  const { state: configState, dispatch } = useConfig();
  const { login } = useAuth();
  const storage = useStorage();
  const { adapter } = useConfigStorage();
  const queryClient = useQueryClient();
  const { scrollToTop } = useEditorScroll();

  const localDetection = useLocalConfigDetection();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configListOpen, setConfigListOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [revisionHistoryOpen, setRevisionHistoryOpen] = useState(false);
  const [importLocalOpen, setImportLocalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  const configListQuery = useConfigListQuery(featureFlags.configStorage);
  const configs = configListQuery.data?.configs ?? [];
  const maxConfigs = configListQuery.data?.maxConfigs ?? adapter.maxConfigs;

  const getDocumentJson = useCallback(() => {
    const project = exportProject(configState.document);
    return JSON.stringify(project);
  }, [configState.document]);

  const handleSaveAs = useCallback(
    async (name: string, comment?: string) => {
      setIsSaving(true);
      storage.setSaving();
      try {
        const result = await adapter.createConfig(name, getDocumentJson(), comment);
        storage.markSaved(result.id, name, result.revision);
        queryClient.invalidateQueries({ queryKey: ["configList"] });
        setSaveDialogOpen(false);
      } catch (err) {
        storage.setError();
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [adapter, getDocumentJson, storage, queryClient],
  );

  const handleQuickSave = useCallback(async () => {
    if (!storage.state.configId) {
      setSaveDialogOpen(true);
      return;
    }

    setIsSaving(true);
    storage.setSaving();
    try {
      const result = await adapter.updateConfigRevision(storage.state.configId, getDocumentJson());
      storage.markSaved(result.id, storage.state.configName ?? "Untitled", result.revision);
      queryClient.invalidateQueries({ queryKey: ["configList"] });
    } catch (err) {
      storage.setError();
      const message = err instanceof Error ? err.message : "";
      if (message.includes("not found") || message.includes("404")) {
        storage.clear();
        setSaveDialogOpen(true);
      }
    } finally {
      setIsSaving(false);
    }
  }, [adapter, storage, getDocumentJson, queryClient]);

  const handleLoad = useCallback(
    async (id: string) => {
      try {
        const config = await adapter.fetchConfig(id);
        const project = JSON.parse(config.latestRevision.document);
        const imported = importProject(project);
        dispatch({ type: "LOAD_DOCUMENT", payload: { document: imported.document } });
        storage.markSaved(config.id, config.name, config.currentRevision);
        scrollToTop();
        setConfigListOpen(false);
      } catch (err) {
        console.error("Load failed:", err);
      }
    },
    [adapter, dispatch, storage, scrollToTop],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await adapter.deleteConfig(id);
        queryClient.invalidateQueries({ queryKey: ["configList"] });
        if (storage.state.configId === id) {
          storage.clear();
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [adapter, queryClient, storage],
  );

  const handleOpenShare = useCallback(async () => {
    if (!storage.state.configId) return;
    setShareDialogOpen(true);
    try {
      const result = await adapter.fetchShareList(storage.state.configId);
      setShares(result.shares);
    } catch (err) {
      console.error("Failed to load shares:", err);
    }
  }, [adapter, storage.state.configId]);

  const handleCreateShare = useCallback(async () => {
    if (!storage.state.configId) return;
    setIsCreatingShare(true);
    try {
      await adapter.createShare(storage.state.configId);
      const result = await adapter.fetchShareList(storage.state.configId);
      setShares(result.shares);
    } catch (err) {
      console.error("Failed to create share:", err);
    } finally {
      setIsCreatingShare(false);
    }
  }, [adapter, storage.state.configId]);

  const handleDeleteShare = useCallback(
    async (shareId: string) => {
      if (!storage.state.configId) return;
      try {
        await adapter.deleteShare(storage.state.configId, shareId);
        setShares((prev) => prev.filter((s) => s.id !== shareId));
      } catch (err) {
        console.error("Failed to delete share:", err);
      }
    },
    [adapter, storage.state.configId],
  );

  const handleOpenRevisions = useCallback(async () => {
    if (!storage.state.configId) return;
    setRevisionHistoryOpen(true);
    setIsLoadingRevisions(true);
    try {
      const result = await adapter.fetchRevisionList(storage.state.configId);
      setRevisions(result.revisions);
    } catch (err) {
      console.error("Failed to load revisions:", err);
    } finally {
      setIsLoadingRevisions(false);
    }
  }, [adapter, storage.state.configId]);

  const handleRestoreRevision = useCallback(
    async (revisionNumber: number) => {
      if (!storage.state.configId) return;
      try {
        const revision = await adapter.fetchRevision(storage.state.configId, revisionNumber);
        // Save the old revision's content as a new revision
        await adapter.updateConfigRevision(
          storage.state.configId,
          revision.document,
          `Restored from rev ${revisionNumber}`,
        );
        // Load it into the editor
        const project = JSON.parse(revision.document);
        const imported = importProject(project);
        dispatch({ type: "LOAD_DOCUMENT", payload: { document: imported.document } });
        const updatedRevisions = await adapter.fetchRevisionList(storage.state.configId);
        setRevisions(updatedRevisions.revisions);
        storage.markSaved(
          storage.state.configId,
          storage.state.configName ?? "Untitled",
          updatedRevisions.revisions[0]?.number ?? storage.state.currentRevision ?? 1,
        );
        queryClient.invalidateQueries({ queryKey: ["configList"] });
        scrollToTop();
      } catch (err) {
        console.error("Restore failed:", err);
      }
    },
    [adapter, storage, dispatch, queryClient, scrollToTop],
  );

  const handleImportLocalComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["configList"] });
    localDetection.recheck();
  }, [queryClient, localDetection]);

  const showLocalBanner = localDetection.hasLocalConfigs && !localDetection.dismissed;

  return (
    <>
      <StorageStatusBar />
      {showLocalBanner && (
        <div className="flex items-center gap-2 border-b border-border bg-blue-500/5 px-3 py-2 text-xs text-muted-foreground">
          <Upload className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span className="flex-1">
            You have {localDetection.localConfigCount} config{localDetection.localConfigCount !== 1 ? "s" : ""} saved
            locally.{" "}
            <button
              type="button"
              onClick={() => setImportLocalOpen(true)}
              className="font-medium text-foreground underline underline-offset-2"
            >
              Import to cloud
            </button>
          </span>
          <button type="button" onClick={localDetection.dismiss} className="rounded-sm p-0.5 hover:bg-muted">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleQuickSave} disabled={isSaving}>
          <Save className="mr-1 h-3 w-3" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setSaveDialogOpen(true)}>
          Save As
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfigListOpen(true)}>
          <FolderOpen className="mr-1 h-3 w-3" />
          Open
        </Button>
        {adapter.supportsSharing && (
          <Button variant="outline" size="icon-sm" onClick={handleOpenShare} disabled={!storage.state.configId}>
            <Link className="h-3 w-3" />
          </Button>
        )}
        <Button variant="outline" size="icon-sm" onClick={handleOpenRevisions} disabled={!storage.state.configId}>
          <Clock className="h-3 w-3" />
        </Button>
      </div>

      <SaveConfigDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveAs}
        defaultName={storage.state.configName ?? ""}
        isSaving={isSaving}
        configCount={configs.length}
        maxConfigs={maxConfigs}
        storageMode={adapter.mode}
        onSignIn={adapter.mode === "local" ? login : undefined}
      />

      <ConfigListDialog
        open={configListOpen}
        onOpenChange={setConfigListOpen}
        configs={configs}
        maxConfigs={maxConfigs}
        onLoad={handleLoad}
        onDelete={handleDelete}
        isLoading={configListQuery.isLoading}
        storageMode={adapter.mode}
        onSignIn={adapter.mode === "local" ? login : undefined}
        localConfigCount={localDetection.hasLocalConfigs ? localDetection.localConfigCount : undefined}
        onImportLocal={localDetection.hasLocalConfigs ? () => setImportLocalOpen(true) : undefined}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shares={shares}
        onCreateShare={handleCreateShare}
        onDeleteShare={handleDeleteShare}
        isCreating={isCreatingShare}
        isDirty={storage.state.isDirty}
      />

      <RevisionHistoryDialog
        open={revisionHistoryOpen}
        onOpenChange={setRevisionHistoryOpen}
        revisions={revisions}
        currentRevision={storage.state.currentRevision ?? 0}
        onRestore={handleRestoreRevision}
        isLoading={isLoadingRevisions}
      />

      <ImportLocalConfigsDialog
        open={importLocalOpen}
        onOpenChange={setImportLocalOpen}
        onImportComplete={handleImportLocalComplete}
      />
    </>
  );
}

export function SidebarActions() {
  const { state, dispatch } = useConfig();
  const { scrollToTop } = useEditorScroll();
  const storage = useStorage();
  const queryClient = useQueryClient();
  const localDetection = useLocalConfigDetection();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [newConfigOpen, setNewConfigOpen] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [importWarnings, setImportWarnings] = useState<ImportWarning[]>([]);
  const [moonrakerDialogOpen, setMoonrakerDialogOpen] = useState(false);
  const [moonrakerExportDialogOpen, setMoonrakerExportDialogOpen] = useState(false);
  const [importLocalOpen, setImportLocalOpen] = useState(false);

  const hasMultipleFiles = (state.document.files?.length ?? 1) > 1;
  const activeFileName = state.activeFile;

  function handleExportCfg() {
    downloadBlob(new Blob([state.generatedOutput], { type: "text/plain" }), activeFileName);
  }

  function handleExportZip() {
    const encoder = new TextEncoder();
    const fileData: Record<string, Uint8Array> = {};
    for (const [name, content] of state.generatedOutputs) {
      fileData[name] = encoder.encode(content);
    }
    const zipped = zipSync(fileData);
    downloadBlob(new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" }), "printer-config.zip");
  }

  function handleExportProject() {
    const project = exportProject(state.document);
    downloadBlob(
      new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }),
      "printer.klipperforge.json",
    );
  }

  function handleCopyToClipboard() {
    navigator.clipboard.writeText(state.generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleImportFiles() {
    fileInputRef.current?.click();
  }

  function handleImportFolder() {
    folderInputRef.current?.click();
  }

  async function importCfgFiles(cfgFiles: File[], nameMapper: (f: File) => string) {
    const fileContents = await Promise.all(
      cfgFiles.map(async (f) => ({
        name: nameMapper(f),
        content: await readFileAsText(f),
      })),
    );
    const doc = parseMultiFileConfigs(fileContents, defaultRegistry);
    dispatch({ type: "LOAD_DOCUMENT", payload: { document: doc } });
    storage.markDirty();
    scrollToTop();
    if (doc.importWarnings) {
      setImportWarnings(doc.importWarnings);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const files = Array.from(fileList);

      // Single JSON file -> project import
      if (files.length === 1 && files[0].name.endsWith(".json")) {
        const text = await readFileAsText(files[0]);
        const project = importProject(JSON.parse(text));
        dispatch({ type: "LOAD_DOCUMENT", payload: { document: project.document } });
        storage.markDirty();
        scrollToTop();
        return;
      }

      // Single .cfg file -> single-file import (backward compat)
      if (files.length === 1 && files[0].name.endsWith(".cfg")) {
        const text = await readFileAsText(files[0]);
        const result = parseKlipperConfig(text, { extended: true });
        const warnings: ImportWarning[] = result.warnings ? [...result.warnings] : [];
        const doc = cfgToDocument(
          result.sections,
          result.mcuBoards,
          defaultRegistry,
          result.saveConfigSections,
          result.presetId,
          warnings,
        );
        dispatch({ type: "LOAD_DOCUMENT", payload: { document: doc } });
        storage.markDirty();
        scrollToTop();
        if (warnings.length > 0) {
          setImportWarnings(warnings);
        }
        return;
      }

      // Multiple files -> multi-file import
      const cfgFiles = files.filter((f) => f.name.endsWith(".cfg"));
      if (cfgFiles.length > 0) {
        await importCfgFiles(cfgFiles, (f) => f.name);
      }
    } catch (err) {
      console.error("Import failed:", err);
    }

    e.target.value = "";
  }

  async function handleFolderChange(e: ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const cfgFiles = Array.from(fileList).filter((f) => f.name.endsWith(".cfg"));
      if (cfgFiles.length > 0) {
        await importCfgFiles(cfgFiles, (f) => stripTopFolder(f.webkitRelativePath || f.name));
      }
    } catch (err) {
      console.error("Folder import failed:", err);
    }

    e.target.value = "";
  }

  function handlePasteImport() {
    if (!pasteContent.trim()) return;
    try {
      const result = parseKlipperConfig(pasteContent, { extended: true });
      const warnings: ImportWarning[] = result.warnings ? [...result.warnings] : [];
      const doc = cfgToDocument(
        result.sections,
        result.mcuBoards,
        defaultRegistry,
        result.saveConfigSections,
        result.presetId,
        warnings,
      );
      dispatch({
        type: "LOAD_DOCUMENT",
        payload: { document: doc },
      });
      storage.markDirty();
      scrollToTop();
      setPasteDialogOpen(false);
      setPasteContent("");
      if (warnings.length > 0) {
        setImportWarnings(warnings);
      }
    } catch (err) {
      console.error("Paste import failed:", err);
    }
  }

  const handleMoonrakerImport = useCallback(
    (files: { name: string; content: string }[]) => {
      const doc = parseMultiFileConfigs(files, defaultRegistry);
      dispatch({ type: "LOAD_DOCUMENT", payload: { document: doc } });
      storage.markDirty();
      scrollToTop();
      setMoonrakerDialogOpen(false);
      if (doc.importWarnings) {
        setImportWarnings(doc.importWarnings);
      }
    },
    [dispatch, storage, scrollToTop],
  );

  const handleImportLocalComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["configList"] });
    localDetection.recheck();
  }, [queryClient, localDetection]);

  return (
    <div className="shrink-0">
      {featureFlags.configStorage && <StorageActions />}
      <div className="flex items-center gap-2 border-t border-border bg-card/50 px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".cfg,.json"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error -- webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          className="hidden"
          onChange={handleFolderChange}
        />
        <Button variant="outline" size="sm" onClick={() => setNewConfigOpen(true)}>
          <FilePlus className="mr-1 h-3 w-3" />
          New
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="mr-1 h-3 w-3" />
              Import
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={handleImportFiles}>
              <File className="mr-1 h-3 w-3" />
              Import files...
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleImportFolder}>
              <Folder className="mr-1 h-3 w-3" />
              Import folder...
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPasteDialogOpen(true)}>
              <Clipboard className="mr-1 h-3 w-3" />
              Paste from clipboard...
            </DropdownMenuItem>
            {featureFlags.configStorage && localDetection.hasLocalConfigs && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setImportLocalOpen(true)}>
                  <HardDrive className="mr-1 h-3 w-3" />
                  Import from local storage...
                </DropdownMenuItem>
              </>
            )}
            {featureFlags.moonrakerImport && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setMoonrakerDialogOpen(true)}>
                  <Server className="mr-1 h-3 w-3" />
                  Import from Moonraker...
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Share className="mr-1 h-3 w-3" />
              Export
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={handleCopyToClipboard}>
              {copied ? <Check className="mr-1 h-3 w-3" /> : <Clipboard className="mr-1 h-3 w-3" />}
              {copied ? "Copied!" : "Copy to clipboard"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleExportCfg}>
              <FileText className="mr-1 h-3 w-3" />
              Export .cfg
            </DropdownMenuItem>
            {hasMultipleFiles && (
              <DropdownMenuItem onSelect={handleExportZip}>
                <FileArchive className="mr-1 h-3 w-3" />
                Export all as .zip
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={handleExportProject}>
              <FileJson className="mr-1 h-3 w-3" />
              Export .klipperforge.json
            </DropdownMenuItem>
            {featureFlags.moonrakerImport && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setMoonrakerExportDialogOpen(true)}>
                  <Server className="mr-1 h-3 w-3" />
                  Export to Moonraker...
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <NewConfigDialog open={newConfigOpen} onOpenChange={setNewConfigOpen} />

        <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import from clipboard</DialogTitle>
              <DialogDescription>Paste your Klipper .cfg configuration text below.</DialogDescription>
            </DialogHeader>
            <Textarea
              className="min-h-[200px] font-mono text-xs"
              placeholder="[printer]&#10;kinematics: cartesian&#10;..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasteImport} disabled={!pasteContent.trim()}>
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ImportWarningsDialog warnings={importWarnings} onClose={() => setImportWarnings([])} />

        {featureFlags.moonrakerImport && (
          <MoonrakerImportDialog
            open={moonrakerDialogOpen}
            onOpenChange={setMoonrakerDialogOpen}
            onImport={handleMoonrakerImport}
          />
        )}

        {featureFlags.moonrakerImport && (
          <MoonrakerExportDialog
            open={moonrakerExportDialogOpen}
            onOpenChange={setMoonrakerExportDialogOpen}
            files={state.generatedOutputs}
          />
        )}

        {featureFlags.configStorage && (
          <ImportLocalConfigsDialog
            open={importLocalOpen}
            onOpenChange={setImportLocalOpen}
            onImportComplete={handleImportLocalComplete}
          />
        )}
      </div>
    </div>
  );
}
