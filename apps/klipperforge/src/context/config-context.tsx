import {
  type BoardPinAlias,
  type BoardPinContext,
  COMMENT_SECTION_TYPE,
  type ConfigDocument,
  type ConfigSourceMap,
  type ConfigValue,
  collectActiveOverrides,
  convertDocumentPins,
  type DefaultMatch,
  defaultRegistry,
  extractBoardPinAliases,
  type McuBoardAssociation,
  type OverrideMap,
  resolveHeader as resolveHeaderBase,
  type SectionInstance,
  type SectionValidationError,
  type SerializeOptions,
  serializeConfigWithSourceMap,
  serializeMultiFileConfig,
  validateDocument,
} from "@klipperforge/klipper-config";
import { createContext, type ReactNode, useContext, useReducer } from "react";

interface ConfigState {
  document: ConfigDocument;
  generatedOutput: string;
  generatedOutputs: Map<string, string>;
  sourceMap: ConfigSourceMap;
  sourceMaps: Map<string, ConfigSourceMap>;
  validationErrors: SectionValidationError[];
  overrideMap: OverrideMap;
  boardPinAliases: BoardPinAlias[];
  showHeader: boolean;
  headerMainOnly: boolean;
  omitDefaults: boolean;
  configEpoch: number;
  boardPinContext: BoardPinContext[];
  activeFile: string;
  baselineOutputs: Map<string, string>;
  isDirty: boolean;
}

type ConfigAction =
  | { type: "SET_SECTION"; payload: SectionInstance }
  | {
      type: "UPDATE_SECTION";
      payload: { header: string; data: Record<string, ConfigValue> };
    }
  | { type: "REMOVE_SECTION"; payload: { header: string } }
  | {
      type: "SET_PRESET";
      payload: { sections: SectionInstance[]; presetId: string; mcuBoards?: McuBoardAssociation[] };
    }
  | { type: "SET_MCU_BOARDS"; payload: { mcuBoards: McuBoardAssociation[]; markDirty: boolean } }
  | { type: "LOAD_DOCUMENT"; payload: { document: ConfigDocument; dirty?: boolean } }
  | { type: "RESET_CONFIG" }
  | { type: "MARK_CLEAN" }
  | { type: "TOGGLE_HEADER" }
  | { type: "TOGGLE_HEADER_MAIN_ONLY" }
  | { type: "TOGGLE_SECTION_DISABLED"; payload: { header: string } }
  | { type: "SET_BOARD_PIN_CONTEXT"; payload: BoardPinContext[] }
  | { type: "RENAME_SECTION"; payload: { header: string; newInstanceName: string } }
  | { type: "SET_ACTIVE_FILE"; payload: { file: string } }
  | { type: "ADD_FILE"; payload: { filename: string } }
  | { type: "REMOVE_FILE"; payload: { filename: string; mode: "delete" | "move" } }
  | { type: "CONVERT_PINS"; payload: { direction: "aliases" | "raw" } }
  | { type: "TOGGLE_OMIT_DEFAULTS" }
  | { type: "REMOVE_SECTIONS"; payload: { headers: string[] } }
  | { type: "ADD_SECTIONS"; payload: { sections: SectionInstance[]; afterHeader?: string } }
  | { type: "MOVE_SECTION"; payload: { header: string; toIndex: number } };

interface ConfigContextValue {
  state: ConfigState;
  dispatch: React.Dispatch<ConfigAction>;
}

const defaultDocument: ConfigDocument = {
  sections: [
    { definitionId: "printer", data: { kinematics: "cartesian" } },
    { definitionId: "mcu", data: {} },
  ],
};

function buildMultiFileState(
  doc: ConfigDocument,
  showHeader: boolean,
  headerMainOnly: boolean,
  omitDefaults: boolean,
  activeFile?: string,
): {
  generatedOutput: string;
  generatedOutputs: Map<string, string>;
  sourceMap: ConfigSourceMap;
  sourceMaps: Map<string, ConfigSourceMap>;
  activeFile: string;
  defaultMatches: DefaultMatch[];
} {
  const opts: SerializeOptions = {
    ...(showHeader ? buildSerializeOptions(doc, headerMainOnly) : undefined),
    omitDefaults,
  };
  const mainFile = doc.files?.[0] ?? "printer.cfg";
  const file = activeFile ?? mainFile;

  if (doc.files && doc.files.length > 1) {
    const multi = serializeMultiFileConfig(doc, defaultRegistry, opts);
    return {
      generatedOutputs: multi.files,
      sourceMaps: multi.sourceMaps,
      generatedOutput: multi.files.get(file) ?? "",
      sourceMap: multi.sourceMaps.get(file) ?? { sectionLines: new Map(), fieldLines: new Map(), rawSectionLines: [] },
      activeFile: file,
      defaultMatches: multi.defaultMatches,
    };
  }

  const result = serializeConfigWithSourceMap(doc, defaultRegistry, opts);
  const outputs = new Map<string, string>();
  outputs.set(mainFile, result.text);
  const maps = new Map<string, ConfigSourceMap>();
  maps.set(mainFile, result.sourceMap);
  return {
    generatedOutputs: outputs,
    sourceMaps: maps,
    generatedOutput: result.text,
    sourceMap: result.sourceMap,
    activeFile: file,
    defaultMatches: result.defaultMatches,
  };
}

function buildStateForDocument(doc: ConfigDocument, isDirty: boolean): ConfigState {
  const multi = buildMultiFileState(doc, true, false, false);
  const validationErrors = validateDocument(doc, defaultRegistry);
  appendDefaultMatchInfoEntries(validationErrors, multi.defaultMatches);
  return {
    document: doc,
    generatedOutput: multi.generatedOutput,
    generatedOutputs: multi.generatedOutputs,
    sourceMap: multi.sourceMap,
    sourceMaps: multi.sourceMaps,
    validationErrors,
    overrideMap: collectActiveOverrides(doc, defaultRegistry),
    boardPinAliases: extractBoardPinAliases(doc),
    showHeader: true,
    headerMainOnly: false,
    omitDefaults: false,
    configEpoch: 0,
    boardPinContext: [],
    activeFile: multi.activeFile,
    baselineOutputs: multi.generatedOutputs,
    isDirty,
  };
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function buildSerializeOptions(doc: ConfigDocument, headerMainOnly: boolean): SerializeOptions {
  const generatedLine = "# Generated by KlipperForge v0.0.1";
  const lines = [generatedLine];
  if (doc.presetId) {
    lines.push(`# klipperforge:printer:${doc.presetId}`);
  }
  return {
    header: lines.join("\n"),
    secondaryHeader: headerMainOnly ? undefined : generatedLine,
  };
}

export function resolveHeader(instance: SectionInstance): string {
  if (instance.definitionId === COMMENT_SECTION_TYPE) {
    return instance.instanceName ?? COMMENT_SECTION_TYPE;
  }
  return resolveHeaderBase(instance, defaultRegistry) ?? instance.definitionId;
}

function appendDefaultMatchInfoEntries(errors: SectionValidationError[], defaultMatches: DefaultMatch[]): void {
  for (const match of defaultMatches) {
    errors.push({
      section: match.section,
      field: match.field,
      message: `Matches default (${match.value})`,
      severity: "info",
    });
  }
}

interface DisplayFlags {
  showHeader: boolean;
  headerMainOnly: boolean;
  omitDefaults: boolean;
}

function updateSectionByHeader(
  sections: SectionInstance[],
  header: string,
  updater: (section: SectionInstance) => SectionInstance,
): SectionInstance[] {
  return sections.map((s) => (resolveHeader(s) === header ? updater(s) : s));
}

function applyDisplayFlags(state: ConfigState, flags: DisplayFlags, options: { revalidate: boolean }): ConfigState {
  const multi = buildMultiFileState(
    state.document,
    flags.showHeader,
    flags.headerMainOnly,
    flags.omitDefaults,
    state.activeFile,
  );
  const next: ConfigState = {
    ...state,
    ...flags,
    ...multi,
    overrideMap: collectActiveOverrides(state.document, defaultRegistry),
    baselineOutputs: state.baselineOutputs,
    boardPinAliases: state.boardPinAliases,
  };
  if (options.revalidate) {
    const validationErrors = validateDocument(state.document, defaultRegistry, {
      boards: state.boardPinContext,
    });
    appendDefaultMatchInfoEntries(validationErrors, multi.defaultMatches);
    next.validationErrors = validationErrors;
  }
  return next;
}

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  let newDoc: ConfigDocument;
  let bumpEpoch = false;
  let nextActiveFile: string | undefined;
  // undefined → use default (true = "mutating action, mark dirty")
  let nextIsDirty: boolean | undefined;

  switch (action.type) {
    case "SET_SECTION": {
      const header = resolveHeader(action.payload);
      const idx = state.document.sections.findIndex((s) => resolveHeader(s) === header);
      const newSections = [...state.document.sections];
      if (idx >= 0) {
        // Preserve existing comments when updating section data
        const existing = newSections[idx];
        const merged = { ...action.payload };
        if (!merged.comments && existing.comments) {
          merged.comments = existing.comments;
        }
        if (merged.file === undefined && existing.file !== undefined) {
          merged.file = existing.file;
        }
        newSections[idx] = merged;
      } else {
        // Insert at position based on definition.order
        const newDef = defaultRegistry.get(action.payload.definitionId);
        const newOrder = newDef?.order ?? 999;
        const insertIdx = newSections.findIndex((s) => {
          if (s.definitionId === COMMENT_SECTION_TYPE) return false;
          const def = defaultRegistry.get(s.definitionId);
          return (def?.order ?? 999) > newOrder;
        });
        if (insertIdx >= 0) {
          newSections.splice(insertIdx, 0, action.payload);
        } else {
          newSections.push(action.payload);
        }
      }
      newDoc = { ...state.document, sections: newSections };
      break;
    }
    case "UPDATE_SECTION": {
      const newSections = updateSectionByHeader(state.document.sections, action.payload.header, (s) => ({
        ...s,
        data: { ...s.data, ...action.payload.data },
      }));
      newDoc = { ...state.document, sections: newSections };
      break;
    }
    case "REMOVE_SECTION": {
      newDoc = {
        ...state.document,
        sections: state.document.sections.filter((s) => resolveHeader(s) !== action.payload.header),
      };
      break;
    }
    case "SET_PRESET": {
      newDoc = {
        sections: action.payload.sections.map((s) => ({
          ...s,
          data: { ...s.data },
        })),
        presetId: action.payload.presetId,
        mcuBoards: action.payload.mcuBoards,
      };
      bumpEpoch = true;
      nextIsDirty = false;
      break;
    }
    case "SET_MCU_BOARDS": {
      newDoc = {
        ...state.document,
        mcuBoards: action.payload.mcuBoards,
      };
      // The sync effect distinguishes its initial-sync (reflecting McuContext's
      // default state) from later syncs caused by real user actions. Only the
      // latter should dirty the document.
      if (!action.payload.markDirty) {
        nextIsDirty = state.isDirty;
      }
      break;
    }
    case "LOAD_DOCUMENT":
      newDoc = action.payload.document;
      bumpEpoch = true;
      nextIsDirty = action.payload.dirty === true;
      break;
    case "RESET_CONFIG":
      newDoc = {
        sections: defaultDocument.sections.map((s) => ({
          ...s,
          data: { ...s.data },
        })),
      };
      bumpEpoch = true;
      nextIsDirty = false;
      break;
    case "MARK_CLEAN":
      return { ...state, isDirty: false };
    case "TOGGLE_SECTION_DISABLED": {
      const newSections = updateSectionByHeader(state.document.sections, action.payload.header, (s) => ({
        ...s,
        disabled: !s.disabled,
      }));
      newDoc = { ...state.document, sections: newSections };
      break;
    }
    case "RENAME_SECTION": {
      const newSections = updateSectionByHeader(state.document.sections, action.payload.header, (s) => ({
        ...s,
        instanceName: action.payload.newInstanceName,
      }));
      newDoc = { ...state.document, sections: newSections };
      break;
    }
    case "TOGGLE_HEADER":
      return applyDisplayFlags(
        state,
        { showHeader: !state.showHeader, headerMainOnly: state.headerMainOnly, omitDefaults: state.omitDefaults },
        { revalidate: false },
      );
    case "TOGGLE_OMIT_DEFAULTS":
      return applyDisplayFlags(
        state,
        { showHeader: state.showHeader, headerMainOnly: state.headerMainOnly, omitDefaults: !state.omitDefaults },
        { revalidate: true },
      );
    case "TOGGLE_HEADER_MAIN_ONLY":
      return applyDisplayFlags(
        state,
        { showHeader: state.showHeader, headerMainOnly: !state.headerMainOnly, omitDefaults: state.omitDefaults },
        { revalidate: false },
      );
    case "SET_BOARD_PIN_CONTEXT": {
      const boardPinContext = action.payload;
      const multi = buildMultiFileState(
        state.document,
        state.showHeader,
        state.headerMainOnly,
        state.omitDefaults,
        state.activeFile,
      );
      const validationErrors = validateDocument(state.document, defaultRegistry, {
        boards: boardPinContext,
      });
      appendDefaultMatchInfoEntries(validationErrors, multi.defaultMatches);
      return {
        ...state,
        boardPinContext,
        validationErrors,
        baselineOutputs: state.baselineOutputs,
        boardPinAliases: state.boardPinAliases,
      };
    }
    case "SET_ACTIVE_FILE": {
      const file = action.payload.file;
      const emptySourceMap: ConfigSourceMap = { sectionLines: new Map(), fieldLines: new Map(), rawSectionLines: [] };
      return {
        ...state,
        activeFile: file,
        generatedOutput: state.generatedOutputs.get(file) ?? "",
        sourceMap: state.sourceMaps.get(file) ?? emptySourceMap,
        baselineOutputs: state.baselineOutputs,
        boardPinAliases: state.boardPinAliases,
      };
    }
    case "ADD_FILE": {
      const existingFiles = state.document.files ?? ["printer.cfg"];
      const newFiles = [...existingFiles, action.payload.filename];
      const hasInclude = state.document.sections.some(
        (s) => s.definitionId === "include" && s.instanceName === action.payload.filename,
      );
      const newSections = hasInclude
        ? state.document.sections
        : [...state.document.sections, { definitionId: "include", instanceName: action.payload.filename, data: {} }];
      newDoc = { ...state.document, files: newFiles, sections: newSections };
      nextActiveFile = action.payload.filename;
      break;
    }
    case "REMOVE_FILE": {
      const currentFiles = state.document.files ?? ["printer.cfg"];
      if (action.payload.filename === currentFiles[0]) {
        return state;
      }
      let newSections: SectionInstance[];
      if (action.payload.mode === "move") {
        newSections = state.document.sections
          .filter((s) => !(s.definitionId === "include" && s.instanceName === action.payload.filename))
          .map((s) => (s.file === action.payload.filename ? { ...s, file: undefined } : s));
      } else {
        newSections = state.document.sections.filter(
          (s) =>
            s.file !== action.payload.filename &&
            !(s.definitionId === "include" && s.instanceName === action.payload.filename),
        );
      }
      const remainingFiles = currentFiles.filter((f) => f !== action.payload.filename);
      if (remainingFiles.length <= 1) {
        newSections = newSections.map((s) => (s.file ? { ...s, file: undefined } : s));
        newDoc = { ...state.document, sections: newSections, files: undefined };
      } else {
        newDoc = { ...state.document, sections: newSections, files: remainingFiles };
      }
      nextActiveFile = remainingFiles[0];
      break;
    }
    case "REMOVE_SECTIONS": {
      const headersToRemove = new Set(action.payload.headers);
      newDoc = {
        ...state.document,
        sections: state.document.sections.filter((s) => !headersToRemove.has(resolveHeader(s))),
      };
      break;
    }
    case "ADD_SECTIONS": {
      const { sections: newSections, afterHeader } = action.payload;
      if (afterHeader) {
        const existing = [...state.document.sections];
        const afterIdx = existing.findIndex((s) => resolveHeader(s) === afterHeader);
        if (afterIdx >= 0) {
          existing.splice(afterIdx + 1, 0, ...newSections);
          newDoc = { ...state.document, sections: existing };
        } else {
          newDoc = { ...state.document, sections: [...state.document.sections, ...newSections] };
        }
      } else {
        newDoc = { ...state.document, sections: [...state.document.sections, ...newSections] };
      }
      break;
    }
    case "MOVE_SECTION": {
      const { header, toIndex } = action.payload;
      const fromIdx = state.document.sections.findIndex((s) => resolveHeader(s) === header);
      if (fromIdx >= 0 && fromIdx !== toIndex) {
        const sections = [...state.document.sections];
        const [moved] = sections.splice(fromIdx, 1);
        const adjustedIndex = toIndex > fromIdx ? toIndex - 1 : toIndex;
        sections.splice(adjustedIndex, 0, moved);
        newDoc = { ...state.document, sections };
      } else {
        return state;
      }
      break;
    }
    case "CONVERT_PINS": {
      newDoc = convertDocumentPins(state.document, state.boardPinAliases, action.payload.direction);
      break;
    }
    default:
      return state;
  }

  // For LOAD_DOCUMENT, reset activeFile to first file
  const activeFile = nextActiveFile ?? (bumpEpoch ? (newDoc.files?.[0] ?? "printer.cfg") : state.activeFile);
  const multi = buildMultiFileState(newDoc, state.showHeader, state.headerMainOnly, state.omitDefaults, activeFile);

  const validationErrors = validateDocument(newDoc, defaultRegistry, {
    boards: state.boardPinContext,
  });
  appendDefaultMatchInfoEntries(validationErrors, multi.defaultMatches);

  return {
    document: newDoc,
    ...multi,
    validationErrors,
    overrideMap: collectActiveOverrides(newDoc, defaultRegistry),
    boardPinAliases: extractBoardPinAliases(newDoc),
    showHeader: state.showHeader,
    headerMainOnly: state.headerMainOnly,
    omitDefaults: state.omitDefaults,
    configEpoch: bumpEpoch ? state.configEpoch + 1 : state.configEpoch,
    boardPinContext: state.boardPinContext,
    baselineOutputs: bumpEpoch ? multi.generatedOutputs : state.baselineOutputs,
    isDirty: nextIsDirty ?? true,
  };
}

interface ConfigProviderProps {
  children: ReactNode;
}

function loadInitialConfigState(): ConfigState {
  const restored = tryLoadDraftSync();
  if (restored) {
    return buildStateForDocument(restored.document, restored.isDirty);
  }
  return buildStateForDocument(defaultDocument, false);
}

function tryLoadDraftSync(): { document: ConfigDocument; isDirty: boolean } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("klipperforge:draft");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { document?: unknown; isDirty?: unknown };
    if (typeof parsed.document !== "string") return null;
    const project = JSON.parse(parsed.document) as { version?: unknown; document?: ConfigDocument };
    if (project.version !== 1 || !project.document || !Array.isArray(project.document.sections)) {
      return null;
    }
    return {
      document: project.document,
      isDirty: parsed.isDirty === true,
    };
  } catch {
    return null;
  }
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [state, dispatch] = useReducer(configReducer, undefined, loadInitialConfigState);

  return <ConfigContext.Provider value={{ state, dispatch }}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
