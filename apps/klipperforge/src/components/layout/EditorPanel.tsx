import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveHeader, useConfig } from "@/context/config-context";
import { featureFlags } from "@/lib/feature-flags";
import { ConfigEditor, type InlineEditRequest, JsonViewer, computeChangedLines } from "@klipperforge/editor";
import {
  type ConfigValue,
  type ParamDefinition,
  type SectionValidationError,
  cfgToDocument,
  defaultRegistry,
  exportProject,
  parseKlipperConfig,
} from "@klipperforge/klipper-config";
import { AlertTriangle, GitCompareArrows, Plus, X, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const FILENAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function parseEditedValue(raw: string, paramDef?: ParamDefinition): ConfigValue | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;

  if (paramDef) {
    switch (paramDef.type.kind) {
      case "number": {
        const num = Number(trimmed);
        if (!Number.isNaN(num)) return num;
        return trimmed;
      }
      case "boolean": {
        const lower = trimmed.toLowerCase();
        if (lower === "true" || lower === "yes" || lower === "on") return true;
        if (lower === "false" || lower === "no" || lower === "off") return false;
        return trimmed;
      }
      case "choice":
      case "string":
      case "multiline":
      case "list":
        return trimmed;
    }
  }

  // Heuristic when no param definition
  const num = Number(trimmed);
  if (!Number.isNaN(num)) return num;

  const lower = trimmed.toLowerCase();
  if (lower === "true" || lower === "yes" || lower === "on") return true;
  if (lower === "false" || lower === "no" || lower === "off") return false;

  return trimmed;
}

function findParamDefinition(header: string, field: string): ParamDefinition | undefined {
  for (const def of defaultRegistry.all()) {
    switch (def.naming.kind) {
      case "fixed":
        if (def.naming.header === header) return def.params?.[field];
        break;
      case "suffixed":
        if (header.startsWith(`${def.naming.prefix}_`)) return def.params?.[field];
        break;
      case "named":
        if (header.startsWith(`${def.naming.prefix} `)) return def.params?.[field];
        break;
      case "custom":
        if (def.naming.header === header) return def.params?.[field];
        break;
    }
  }
  return undefined;
}

interface RemoveFileState {
  filename: string;
  sectionCount: number;
}

export function EditorPanel() {
  const { state, dispatch } = useConfig();
  const [diffEnabled, setDiffEnabled] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileError, setNewFileError] = useState("");
  const [removeFile, setRemoveFile] = useState<RemoveFileState | null>(null);
  const files = state.document.files ?? ["printer.cfg"];
  const activeTab = state.activeFile;
  const mainFile = files[0];

  const isJsonTab = activeTab === "__json__";
  const jsonString = useMemo(
    () => (isJsonTab ? JSON.stringify(exportProject(state.document), null, 2) : ""),
    [isJsonTab, state.document],
  );

  const sectionFileMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of state.document.sections) {
      const header = resolveHeader(section);
      map.set(header, section.file ?? mainFile);
    }
    return map;
  }, [state.document.sections, mainFile]);

  const fileValidationErrors = useMemo(() => {
    const map = new Map<string, SectionValidationError[]>();
    for (const file of files) {
      map.set(file, []);
    }
    for (const error of state.validationErrors) {
      const file = sectionFileMap.get(error.section) ?? mainFile;
      map.get(file)?.push(error);
    }
    return map;
  }, [state.validationErrors, sectionFileMap, files, mainFile]);

  const diffLines = useMemo(() => {
    if (!diffEnabled) return undefined;
    const baseline = state.baselineOutputs.get(activeTab);
    if (baseline === undefined) return undefined;
    return computeChangedLines(baseline, state.generatedOutput);
  }, [diffEnabled, activeTab, state.baselineOutputs, state.generatedOutput]);

  function handleTabChange(value: string) {
    dispatch({ type: "SET_ACTIVE_FILE", payload: { file: value } });
  }

  const handleValueEdit = useCallback(
    (edit: InlineEditRequest) => {
      const paramDef = findParamDefinition(edit.header, edit.field);
      const parsedValue = parseEditedValue(edit.newValue, paramDef);

      if (parsedValue === undefined) {
        const section = state.document.sections.find((s) => resolveHeader(s) === edit.header);
        if (!section) return;
        const { [edit.field]: _, ...rest } = section.data;
        dispatch({ type: "SET_SECTION", payload: { ...section, data: rest } });
      } else {
        dispatch({
          type: "UPDATE_SECTION",
          payload: { header: edit.header, data: { [edit.field]: parsedValue } },
        });
      }
    },
    [dispatch, state.document.sections],
  );

  const handleSectionsCut = useCallback(
    (headers: string[]) => {
      dispatch({ type: "REMOVE_SECTIONS", payload: { headers } });
    },
    [dispatch],
  );

  const handleSectionsPaste = useCallback(
    (text: string, afterHeader?: string) => {
      const parsed = parseKlipperConfig(text, { extended: true });
      if (parsed.sections.length === 0) return;
      const doc = cfgToDocument(parsed.sections, [], defaultRegistry);
      const mainFile = state.document.files?.[0] ?? "printer.cfg";
      const isMultiFile = (state.document.files?.length ?? 1) > 1;
      const sections = doc.sections.map((s) => {
        if (isMultiFile && state.activeFile !== mainFile) {
          return { ...s, file: state.activeFile };
        }
        return s;
      });
      dispatch({ type: "ADD_SECTIONS", payload: { sections, afterHeader } });
    },
    [dispatch, state.document.files, state.activeFile],
  );

  const handleNavigateToError = useCallback(
    (error: SectionValidationError) => {
      const section = state.document.sections.find((s) => resolveHeader(s) === error.section);
      if (!section) return;
      const sectionFile = section.file ?? mainFile;
      if (sectionFile !== state.activeFile) {
        dispatch({ type: "SET_ACTIVE_FILE", payload: { file: sectionFile } });
      }
    },
    [state.document.sections, state.activeFile, mainFile, dispatch],
  );

  function handleAddFileSubmit() {
    const name = newFileName.trim();
    if (!name) {
      setNewFileError("Filename is required");
      return;
    }
    if (!FILENAME_PATTERN.test(name)) {
      setNewFileError("Only letters, numbers, hyphens, and underscores");
      return;
    }
    const filename = name.endsWith(".cfg") ? name : `${name}.cfg`;
    if (files.includes(filename)) {
      setNewFileError("File already exists");
      return;
    }
    dispatch({ type: "ADD_FILE", payload: { filename } });
    setNewFileName("");
    setNewFileError("");
    setAddFileOpen(false);
  }

  function handleRemoveFileClick(e: React.MouseEvent, filename: string) {
    e.stopPropagation();
    const sectionCount = state.document.sections.filter((s) => s.file === filename).length;
    setRemoveFile({ filename, sectionCount });
  }

  function handleRemoveFile(mode: "delete" | "move") {
    if (!removeFile) return;
    dispatch({ type: "REMOVE_FILE", payload: { filename: removeFile.filename, mode } });
    setRemoveFile(null);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full flex-col gap-0">
      <div className="flex items-center overflow-x-auto border-b border-border bg-card px-3 py-1">
        <TabsList className="h-7 flex-nowrap">
          {files.map((file) => {
            const errors = fileValidationErrors.get(file) ?? [];
            const hasErrors = errors.some((e) => e.severity !== "warning" && e.severity !== "info");
            const hasWarnings = !hasErrors && errors.some((e) => e.severity === "warning");
            return (
              <TabsTrigger key={file} value={file} className="group/tab shrink-0 text-xs">
                {file}
                {hasErrors && <XCircle className="ml-1 size-3 text-red-500" />}
                {hasWarnings && <AlertTriangle className="ml-1 size-3 text-amber-500" />}
                {file !== mainFile && (
                  // biome-ignore lint/a11y/useSemanticElements: cannot nest <button> inside TabsTrigger (button)
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 inline-flex size-5 items-center justify-center rounded-sm hover:bg-accent md:size-3.5 md:opacity-0 md:group-hover/tab:opacity-100"
                    onClick={(e) => handleRemoveFileClick(e, file)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRemoveFileClick(e as unknown as React.MouseEvent, file)
                    }
                  >
                    <X className="size-2.5" />
                  </span>
                )}
              </TabsTrigger>
            );
          })}
          <Popover open={addFileOpen} onOpenChange={setAddFileOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-0.5"
                title="Add config file"
                onClick={() => {
                  setNewFileName("");
                  setNewFileError("");
                }}
              >
                <Plus className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddFileSubmit();
                }}
                className="flex flex-col gap-2"
              >
                <FieldWrapper name="New config file" error={newFileError || undefined}>
                  {({ id }) => (
                    <Input
                      id={id}
                      className="h-7 text-xs"
                      placeholder="e.g. macros"
                      value={newFileName}
                      onChange={(e) => {
                        setNewFileName(e.target.value);
                        setNewFileError("");
                      }}
                      autoFocus
                    />
                  )}
                </FieldWrapper>
                <p className="text-[10px] text-muted-foreground">.cfg extension added automatically</p>
                <Button type="submit" size="sm" className="h-7 text-xs">
                  Add file
                </Button>
              </form>
            </PopoverContent>
          </Popover>
          {featureFlags.projectJsonTab && (
            <TabsTrigger value="__json__" className="text-xs">
              project.json
            </TabsTrigger>
          )}
        </TabsList>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setDiffEnabled((v) => !v)}
          title="Toggle diff highlighting"
          className="ml-auto data-[active=true]:bg-accent"
          data-active={diffEnabled}
        >
          <GitCompareArrows className="size-3.5" />
        </Button>
      </div>
      {files.map((file) => (
        <TabsContent key={file} value={file} className="mt-0 flex-1 overflow-hidden">
          <ConfigEditor
            value={state.generatedOutput}
            validationErrors={fileValidationErrors.get(file) ?? []}
            sourceMap={state.sourceMap}
            overrideMap={state.overrideMap}
            diffLines={diffLines}
            onValueEdit={handleValueEdit}
            onSectionsCut={handleSectionsCut}
            onSectionsPaste={handleSectionsPaste}
            onNavigateToError={handleNavigateToError}
          />
        </TabsContent>
      ))}
      {featureFlags.projectJsonTab && (
        <TabsContent value="__json__" className="mt-0 flex-1 overflow-hidden">
          <JsonViewer value={jsonString} />
        </TabsContent>
      )}

      <Dialog open={removeFile !== null} onOpenChange={(open) => !open && setRemoveFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeFile?.filename}</DialogTitle>
            <DialogDescription>
              This file contains {removeFile?.sectionCount ?? 0} section(s). What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="secondary" onClick={() => handleRemoveFile("move")}>
              Move to {mainFile}
            </Button>
            <Button variant="destructive" onClick={() => handleRemoveFile("delete")}>
              Delete sections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
