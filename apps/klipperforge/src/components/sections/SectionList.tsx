import type { SectionInstance } from "@klipperforge/klipper-config";
import { COMMENT_SECTION_TYPE, defaultRegistry } from "@klipperforge/klipper-config";
import {
  Calculator,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  LocateFixed,
  Pencil,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { resolveHeader, useConfig } from "@/context/config-context";
import { useCollapsibleSections } from "@/hooks/use-collapsible-sections";
import { NamePromptDialog } from "./NamePromptDialog";
import { RemoveConfirmButton } from "./RemoveConfirmButton";
import { SectionEditor } from "./SectionEditor";

const PLUGIN_SECTIONS = new Set([
  "cartographer",
  "cartographer_scan",
  "cartographer_touch",
  "cartographer_coil",
  "beacon",
  "led_effect",
  "shaketune",
  "autotune_tmc",
  "motor_constants",
]);

function getConfigReferenceUrl(section: SectionInstance): string | null {
  const def = defaultRegistry.get(section.definitionId);
  if (!def) return null;

  let baseName: string;
  switch (def.naming.kind) {
    case "fixed":
      baseName = def.naming.header;
      break;
    case "suffixed":
    case "named":
      baseName = def.naming.prefix;
      break;
    case "custom":
      baseName = def.naming.header;
      break;
  }

  if (PLUGIN_SECTIONS.has(baseName)) return null;

  return `https://www.klipper3d.org/Config_Reference.html#${baseName}`;
}

function buildCalibrationUrl(section: SectionInstance, allSections: SectionInstance[]): string | null {
  if (section.definitionId !== "screws_tilt_adjust") return null;

  const probeSection = allSections.find((s) => "x_offset" in s.data && "y_offset" in s.data);
  const probeX = probeSection ? Number(probeSection.data.x_offset) || 0 : 0;
  const probeY = probeSection ? Number(probeSection.data.y_offset) || 0 : 0;

  const screws: { x: number; y: number; name: string }[] = [];
  for (let i = 1; ; i++) {
    const pos = section.data[`screw${i}`];
    if (typeof pos !== "string") break;
    const [xStr, yStr] = pos.split(",").map((s) => s.trim());
    const x = Number.parseFloat(xStr);
    const y = Number.parseFloat(yStr);
    if (Number.isNaN(x) || Number.isNaN(y)) break;
    const name = (section.data[`screw${i}_name`] as string) ?? "";
    screws.push({ x: x + probeX, y: y + probeY, name });
  }

  if (screws.length === 0) return null;

  const params = new URLSearchParams({
    guide: "bed-screw-positions",
    probe_x: String(probeX),
    probe_y: String(probeY),
    screws: JSON.stringify(screws),
  });

  return `/calibration?${params.toString()}`;
}

function getCommentPreview(rawText: string): string {
  const firstContentLine = rawText.split("\n").find((line) => {
    const trimmed = line.replace(/^[#;]\s*/, "").trim();
    return trimmed !== "" && !/^[#=\-*_]{3,}$/.test(trimmed);
  });
  if (!firstContentLine) return "#";
  const content = firstContentLine.replace(/^[#;]\s*/, "").trim();
  return content.length > 40 ? `# ${content.slice(0, 40)}...` : `# ${content}`;
}

function stripCommentPrefixes(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/^[#;]\s?/, ""))
    .join("\n");
}

function addCommentPrefixes(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? "#" : `# ${line}`))
    .join("\n");
}

interface CommentSectionEditorProps {
  section: SectionInstance;
  header: string;
}

function CommentSectionEditor({ section, header }: CommentSectionEditorProps) {
  const { dispatch } = useConfig();
  const displayText = stripCommentPrefixes(section.rawText ?? "");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({
        type: "SET_SECTION",
        payload: { ...section, rawText: addCommentPrefixes(e.target.value) },
      });
    },
    [dispatch, section],
  );

  return (
    <div className="px-2 py-2">
      <textarea
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
        rows={Math.min(Math.max(displayText.split("\n").length, 2), 20)}
        value={displayText}
        onChange={handleChange}
        data-field-id={`${header}-rawText`}
      />
    </div>
  );
}

interface SectionListProps {
  autoExpandHeader?: string | null;
}

export function SectionList({ autoExpandHeader }: SectionListProps) {
  const { state, dispatch } = useConfig();
  const { expandedSections, toggleSection, expandSection, scrollToSection } = useCollapsibleSections();
  const [renamingSection, setRenamingSection] = useState<SectionInstance | null>(null);
  const [filter, setFilter] = useState("");
  const [dragHeader, setDragHeader] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, header: string) => {
    setDragHeader(header);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", header);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      const header = e.dataTransfer.getData("text/plain");
      if (header) {
        dispatch({ type: "MOVE_SECTION", payload: { header, toIndex: toIdx } });
      }
      setDragHeader(null);
      setDropIndex(null);
    },
    [dispatch],
  );

  const handleDragEnd = useCallback(() => {
    setDragHeader(null);
    setDropIndex(null);
  }, []);
  const filterResetKeyRef = useRef(`${state.configEpoch}:${state.activeFile}`);
  const navigate = useNavigate();

  useEffect(
    function autoExpandEffect() {
      if (autoExpandHeader) {
        expandSection(autoExpandHeader);
      }
    },
    [autoExpandHeader, expandSection],
  );

  const filterResetKey = `${state.configEpoch}:${state.activeFile}`;
  useEffect(
    function resetFilterEffect() {
      if (filterResetKey !== filterResetKeyRef.current) {
        filterResetKeyRef.current = filterResetKey;
        setFilter("");
      }
    },
    [filterResetKey],
  );

  const mainFile = state.document.files?.[0] ?? "printer.cfg";
  const isMultiFile = (state.document.files?.length ?? 1) > 1;
  const isJsonTab = state.activeFile === "__json__";

  const visibleSections =
    isMultiFile && !isJsonTab
      ? state.document.sections.filter((s) => (s.file ?? mainFile) === state.activeFile)
      : state.document.sections;

  if (state.document.sections.length === 0) return null;

  if (visibleSections.length === 0 && isMultiFile) {
    return <p className="px-2 py-4 text-center text-xs text-muted-foreground">No sections in {state.activeFile}.</p>;
  }

  const filteredSections = filter
    ? visibleSections.filter((s) => {
        const headerMatch = resolveHeader(s).toLowerCase().includes(filter.toLowerCase());
        if (headerMatch) return true;
        if (s.definitionId === COMMENT_SECTION_TYPE && s.rawText) {
          return s.rawText.toLowerCase().includes(filter.toLowerCase());
        }
        return false;
      })
    : visibleSections;

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Search className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter sections..."
          className="h-7 pl-7 text-xs"
        />
      </div>
      {filteredSections.map((section, idx) => {
        const header = resolveHeader(section);
        const isComment = section.definitionId === COMMENT_SECTION_TYPE;
        const isDisabled = section.disabled === true;
        const def = isComment ? undefined : defaultRegistry.get(section.definitionId);
        const hasProperties = isComment || (def ? Object.keys(def.params ?? {}).length > 0 : false);
        const canExpand = hasProperties && !isDisabled;
        const isExpanded = canExpand && expandedSections.has(header);
        const key = isComment ? header : `${section.definitionId}-${section.instanceName ?? ""}-${idx}`;
        const globalIdx = state.document.sections.indexOf(section);
        const isDragging = dragHeader === header;
        const isDropTarget = dropIndex === globalIdx;

        if (isComment) {
          return (
            <Collapsible key={key} open={isExpanded} onOpenChange={(open) => toggleSection(header, open)}>
              <div
                data-section-header={header}
                className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted ${isDragging ? "opacity-30" : ""} ${isDropTarget ? "border-t-2 border-primary" : ""}`}
                onDragOver={(e) => !filter && handleDragOver(e, globalIdx)}
                onDrop={(e) => !filter && handleDrop(e, globalIdx)}
              >
                {!filter && (
                  <span
                    draggable
                    onDragStart={(e) => handleDragStart(e, header)}
                    onDragEnd={handleDragEnd}
                    className="hidden shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing md:inline-flex"
                  >
                    <GripVertical className="h-3 w-3" />
                  </span>
                )}
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-1">
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {getCommentPreview(section.rawText ?? "")}
                    </span>
                  </button>
                </CollapsibleTrigger>
                <span className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground md:h-6 md:w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      const lineNum = state.sourceMap.sectionLines.get(header);
                      scrollToSection(header, lineNum);
                    }}
                  >
                    <LocateFixed className="h-3 w-3" />
                  </Button>
                  <RemoveConfirmButton onConfirm={() => dispatch({ type: "REMOVE_SECTION", payload: { header } })} />
                </span>
              </div>
              <CollapsibleContent>
                <CommentSectionEditor section={section} header={header} />
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <Collapsible key={key} open={isExpanded} onOpenChange={(open) => canExpand && toggleSection(header, open)}>
            <div
              data-section-header={header}
              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted ${isDisabled ? "opacity-50" : ""} ${isDragging ? "opacity-30" : ""} ${isDropTarget ? "border-t-2 border-primary" : ""}`}
              onDragOver={(e) => !filter && handleDragOver(e, globalIdx)}
              onDrop={(e) => !filter && handleDrop(e, globalIdx)}
            >
              {!filter && (
                <span
                  draggable
                  onDragStart={(e) => handleDragStart(e, header)}
                  onDragEnd={handleDragEnd}
                  className="hidden shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing md:inline-flex"
                >
                  <GripVertical className="h-3 w-3" />
                </span>
              )}
              <CollapsibleTrigger asChild disabled={!canExpand}>
                <button type="button" className="flex min-w-0 flex-1 items-center gap-1">
                  {canExpand ? (
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  ) : (
                    <span className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate font-mono text-xs">[{header}]</span>
                </button>
              </CollapsibleTrigger>
              <span className="flex shrink-0 items-center gap-0.5">
                {(() => {
                  const isRenamable = def?.naming.kind === "named" || def?.naming.kind === "suffixed";
                  if (!isRenamable) return <span className="hidden h-8 w-8 md:inline-block md:h-6 md:w-6" />;
                  return (
                    <button
                      type="button"
                      className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex md:h-6 md:w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingSection(section);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  );
                })()}
                {(() => {
                  const url = getConfigReferenceUrl(section);
                  if (!url) return null;
                  return (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex md:h-6 md:w-6"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })()}
                {(() => {
                  const calcUrl = buildCalibrationUrl(section, state.document.sections);
                  if (!calcUrl) return null;
                  return (
                    <button
                      type="button"
                      className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex md:h-6 md:w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(calcUrl);
                      }}
                    >
                      <Calculator className="h-3 w-3" />
                    </button>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground md:h-6 md:w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "TOGGLE_SECTION_DISABLED", payload: { header } });
                  }}
                >
                  {isDisabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground md:h-6 md:w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollToSection(header);
                  }}
                >
                  <LocateFixed className="h-3 w-3" />
                </Button>
                <RemoveConfirmButton onConfirm={() => dispatch({ type: "REMOVE_SECTION", payload: { header } })} />
              </span>
            </div>
            {canExpand && (
              <CollapsibleContent>
                <ErrorBoundary>
                  <SectionEditor section={section} header={header} />
                </ErrorBoundary>
              </CollapsibleContent>
            )}
          </Collapsible>
        );
      })}
      {(() => {
        if (!renamingSection) return null;
        const def = defaultRegistry.get(renamingSection.definitionId);
        if (!def || (def.naming.kind !== "named" && def.naming.kind !== "suffixed")) return null;
        const prefix = def.naming.prefix;
        const separator = def.naming.kind === "named" ? " " : "_";
        const currentHeader = resolveHeader(renamingSection);
        const existingHeaders = new Set(state.document.sections.map((s) => resolveHeader(s)));
        existingHeaders.delete(currentHeader);
        return (
          <NamePromptDialog
            open={true}
            onOpenChange={(open) => {
              if (!open) setRenamingSection(null);
            }}
            sectionLabel={def.id}
            existingHeaders={existingHeaders}
            prefix={prefix}
            separator={separator}
            namePattern={def.namePattern}
            namePatternMessage={def.namePatternMessage}
            initialName={renamingSection.instanceName}
            title={`Rename ${def.id}`}
            confirmLabel="Rename"
            onConfirm={(newName) => {
              dispatch({
                type: "RENAME_SECTION",
                payload: { header: currentHeader, newInstanceName: newName },
              });
              setRenamingSection(null);
            }}
          />
        );
      })()}
    </div>
  );
}
