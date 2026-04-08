import type { RevisionSummary, SharedConfigResponse } from "@/api/config-storage-types";
import { fetchSharedConfig, fetchSharedRevision, fetchSharedRevisionList } from "@/api/configs";
import type { PinAssignment } from "@/components/svg/pcb/PcbConnectorRect";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/config-context";
import { downloadBlob } from "@/lib/utils";
import { EditorView, KlipperConfigViewer, flashLineEffect } from "@klipperforge/editor";
import { exportProject, importProject } from "@klipperforge/klipper-config";
import { zipSync } from "fflate";
import { Check, ChevronDown, Clipboard, Clock, Download, ExternalLink, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { SharedPcbStrip } from "./SharedPcbStrip";

interface SharedConfigViewProps {
  shareToken: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function SharedConfigView({ shareToken }: SharedConfigViewProps) {
  const { dispatch, state } = useConfig();
  const navigate = useNavigate();
  const [sharedConfig, setSharedConfig] = useState<SharedConfigResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [activeRevision, setActiveRevision] = useState<number | null>(null);
  const [loadingRevision, setLoadingRevision] = useState<number | null>(null);

  const editorViewsRef = useRef(new Map<string, EditorView>());
  const containerRefsRef = useRef(new Map<string, HTMLDivElement>());

  const handlePinClick = useCallback((assignment: PinAssignment) => {
    const sectionTarget = `[${assignment.section}]`;
    for (const [filename, view] of editorViewsRef.current) {
      const doc = view.state.doc;
      let inSection = false;
      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const trimmed = line.text.trim();
        if (trimmed.startsWith("[") && trimmed.includes("]")) {
          if (inSection) break;
          if (trimmed === sectionTarget || trimmed.startsWith(`${sectionTarget} `)) {
            inSection = true;
          }
          continue;
        }
        if (inSection && (trimmed.startsWith(`${assignment.field}:`) || trimmed.startsWith(`${assignment.field}=`))) {
          containerRefsRef.current.get(filename)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          view.dispatch({
            effects: [
              flashLineEffect.of(line.from),
              EditorView.scrollIntoView(line.from, { y: "center", yMargin: 50 }),
            ],
          });
          return;
        }
      }
    }
  }, []);

  const sortedFiles = useMemo(() => {
    const entries = [...state.generatedOutputs.entries()];
    return entries.sort(([a], [b]) => {
      if (a === "printer.cfg") return -1;
      if (b === "printer.cfg") return 1;
      return a.localeCompare(b);
    });
  }, [state.generatedOutputs]);

  const hasMultipleFiles = sortedFiles.length > 1;

  useEffect(
    function loadSharedConfigEffect() {
      async function load() {
        try {
          const result = await fetchSharedConfig(shareToken);
          setSharedConfig(result);
          setActiveRevision(result.revisionNumber);
          const project = JSON.parse(result.document);
          const imported = importProject(project);
          dispatch({ type: "LOAD_DOCUMENT", payload: { document: imported.document } });
          setLoaded(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load shared config");
        } finally {
          setIsLoading(false);
        }
      }

      load();
    },
    [shareToken, dispatch],
  );

  const handleToggleRevisions = useCallback(async () => {
    if (showRevisions) {
      setShowRevisions(false);
      return;
    }

    setShowRevisions(true);
    if (revisions.length === 0) {
      try {
        const result = await fetchSharedRevisionList(shareToken);
        setRevisions(result.revisions);
      } catch (err) {
        console.error("Failed to load revisions:", err);
      }
    }
  }, [showRevisions, revisions.length, shareToken]);

  const handleSelectRevision = useCallback(
    async (revisionNumber: number) => {
      if (revisionNumber === activeRevision) return;

      setLoadingRevision(revisionNumber);
      try {
        const revision = await fetchSharedRevision(shareToken, revisionNumber);
        const project = JSON.parse(revision.document);
        const imported = importProject(project);
        dispatch({ type: "LOAD_DOCUMENT", payload: { document: imported.document } });
        setActiveRevision(revisionNumber);
      } catch (err) {
        console.error("Failed to load revision:", err);
      } finally {
        setLoadingRevision(null);
      }
    },
    [shareToken, activeRevision, dispatch],
  );

  function handleExportCfg() {
    const [filename, content] = sortedFiles[0] ?? ["printer.cfg", ""];
    downloadBlob(new Blob([content], { type: "text/plain" }), filename);
  }

  function handleExportZip() {
    const encoder = new TextEncoder();
    const fileData: Record<string, Uint8Array> = {};
    for (const [name, content] of sortedFiles) {
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

  function handleCopy() {
    const allContent = sortedFiles.map(([filename, content]) => `# ${filename}\n${content}`).join("\n\n");
    navigator.clipboard.writeText(allContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFork() {
    navigate("/");
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-destructive">Failed to load shared config</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  if (!sharedConfig || !loaded) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h2 className="font-semibold">{sharedConfig.name}</h2>
          <p className="text-xs text-muted-foreground">
            Shared by {sharedConfig.owner} &middot; Rev {activeRevision}
            {activeRevision !== sharedConfig.revisionNumber && " (not latest)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleRevisions}>
            <Clock className="mr-1 h-3 w-3" />
            Revisions
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showRevisions ? "rotate-180" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="mr-1 h-3 w-3" /> : <Clipboard className="mr-1 h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button variant="outline" size="sm" onClick={hasMultipleFiles ? handleExportZip : handleExportCfg}>
            <Download className="mr-1 h-3 w-3" />
            {hasMultipleFiles ? "Export .zip" : "Export .cfg"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportProject}>
            <Download className="mr-1 h-3 w-3" />
            Export .json
          </Button>
          <Button size="sm" onClick={handleFork}>
            <ExternalLink className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
      </div>
      {showRevisions && (
        <div className="border-b border-border bg-card">
          <div className="max-h-48 overflow-y-auto px-4 py-2">
            {revisions.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-1">
                {revisions.map((rev) => (
                  <button
                    key={rev.number}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      rev.number === activeRevision ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelectRevision(rev.number)}
                    disabled={loadingRevision === rev.number}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">Rev {rev.number}</span>
                      {rev.number === sharedConfig.revisionNumber && (
                        <span className="ml-2 text-xs text-muted-foreground">(latest)</span>
                      )}
                      {rev.comment && <span className="ml-2 text-xs text-muted-foreground">{rev.comment}</span>}
                    </div>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {loadingRevision === rev.number
                        ? "Loading..."
                        : `${new Date(rev.createdAt).toLocaleDateString()} · ${formatBytes(rev.documentSize)}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 space-y-4 overflow-auto bg-muted/30 p-4">
        <SharedPcbStrip onPinClick={handlePinClick} />
        {sortedFiles.map(([filename, content]) => (
          <div
            key={filename}
            ref={(el) => {
              if (el) containerRefsRef.current.set(filename, el);
              else containerRefsRef.current.delete(filename);
            }}
            className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="border-b border-border px-4 py-2 text-sm font-medium">{filename}</div>
            <KlipperConfigViewer
              value={content}
              onCreateEditor={(view) => {
                editorViewsRef.current.set(filename, view);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
