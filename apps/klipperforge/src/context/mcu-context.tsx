import { type BoardPinContext, resolvePinAlias, SHARED_BUS_PIN_FIELDS } from "@klipperforge/klipper-config";
import type { McuBoard, McuBoardIndexEntry, PinUsage } from "@klipperforge/printer-data";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { useBoardDataQuery, useBoardIndexQuery, usePcbLayoutIndexQuery } from "@/hooks/use-queries";
import { resolveHeader, useConfig } from "./config-context";

interface McuBoardInstance {
  boardId: string;
  alias: string;
  selectedMcu?: string;
  jumperSelections?: Record<string, string>;
  board: McuBoard | null;
}

interface McuState {
  boards: McuBoardInstance[];
  activePcbBoard: number;
}

type McuAction =
  | { type: "ADD_BOARD" }
  | { type: "REMOVE_BOARD"; payload: { index: number } }
  | {
      type: "UPDATE_BOARD";
      payload: { index: number; boardId?: string; alias?: string };
    }
  | {
      type: "SET_BOARD_DATA";
      payload: { index: number; board: McuBoard };
    }
  | { type: "SET_ACTIVE_PCB_BOARD"; payload: { index: number } }
  | { type: "SET_MCU_VARIANT"; payload: { index: number; mcu: string | undefined } }
  | { type: "SET_JUMPER_SELECTION"; payload: { index: number; connector: string; label: string | undefined } }
  | {
      type: "RESTORE_BOARDS";
      payload: {
        boards: { boardId: string; alias: string; selectedMcu?: string; jumperSelections?: Record<string, string> }[];
      };
    };

interface McuContextValue {
  state: McuState;
  dispatch: React.Dispatch<McuAction>;
  boardIndex: McuBoardIndexEntry[];
  pcbBoardIds: Set<string>;
  imageBoardIds: Set<string>;
  getUsedPins: () => Map<string, PinUsage>;
}

const defaultState: McuState = {
  boards: [{ boardId: "generic-stm32f446", alias: "", board: null }],
  activePcbBoard: 0,
};

const McuContext = createContext<McuContextValue | null>(null);

function mcuReducer(state: McuState, action: McuAction): McuState {
  switch (action.type) {
    case "ADD_BOARD": {
      const existingAliases = new Set(state.boards.map((b) => b.alias));
      let alias = "mcu2";
      let counter = 2;
      while (existingAliases.has(alias)) {
        counter++;
        alias = `mcu${counter}`;
      }
      return {
        ...state,
        boards: [...state.boards, { boardId: "generic-stm32f446", alias, board: null }],
      };
    }
    case "REMOVE_BOARD": {
      if (action.payload.index === 0) return state;
      const newBoards = state.boards.filter((_, i) => i !== action.payload.index);
      let newActive = state.activePcbBoard;
      if (action.payload.index === state.activePcbBoard || state.activePcbBoard >= newBoards.length) {
        newActive = 0;
      }
      return {
        ...state,
        boards: newBoards,
        activePcbBoard: newActive,
      };
    }
    case "UPDATE_BOARD": {
      const newBoards = [...state.boards];
      const current = newBoards[action.payload.index];
      newBoards[action.payload.index] = {
        ...current,
        ...(action.payload.boardId !== undefined && {
          boardId: action.payload.boardId,
          board: null,
          selectedMcu: undefined,
          jumperSelections: undefined,
        }),
        ...(action.payload.alias !== undefined && {
          alias: action.payload.alias,
        }),
      };
      return { ...state, boards: newBoards };
    }
    case "SET_BOARD_DATA": {
      const newBoards = [...state.boards];
      newBoards[action.payload.index] = {
        ...newBoards[action.payload.index],
        board: action.payload.board,
      };
      return { ...state, boards: newBoards };
    }
    case "SET_ACTIVE_PCB_BOARD":
      return { ...state, activePcbBoard: action.payload.index };
    case "SET_MCU_VARIANT": {
      const newBoards = [...state.boards];
      newBoards[action.payload.index] = {
        ...newBoards[action.payload.index],
        selectedMcu: action.payload.mcu,
      };
      return { ...state, boards: newBoards };
    }
    case "SET_JUMPER_SELECTION": {
      const newBoards = [...state.boards];
      const current = newBoards[action.payload.index];
      const selections = { ...current.jumperSelections };
      if (action.payload.label === undefined) {
        delete selections[action.payload.connector];
      } else {
        selections[action.payload.connector] = action.payload.label;
      }
      newBoards[action.payload.index] = {
        ...current,
        jumperSelections: Object.keys(selections).length > 0 ? selections : undefined,
      };
      return { ...state, boards: newBoards };
    }
    case "RESTORE_BOARDS": {
      return {
        ...state,
        boards: action.payload.boards.map((b) => ({
          boardId: b.boardId,
          alias: b.alias,
          selectedMcu: b.selectedMcu,
          jumperSelections: b.jumperSelections,
          board: null,
        })),
        activePcbBoard: 0,
      };
    }
    default:
      return state;
  }
}

interface McuProviderProps {
  children: ReactNode;
}

export function McuProvider({ children }: McuProviderProps) {
  const [state, dispatch] = useReducer(mcuReducer, defaultState);
  const { state: configState, dispatch: configDispatch } = useConfig();

  const boardIndexQuery = useBoardIndexQuery();
  const pcbIndexQuery = usePcbLayoutIndexQuery();

  const boardIndex = boardIndexQuery.data.boards;
  const imageBoardIds = useMemo(() => new Set(boardIndex.filter((b) => b.hasImage).map((b) => b.id)), [boardIndex]);
  const pcbBoardIds = useMemo(() => new Set(pcbIndexQuery.data.layouts.map((l) => l.boardId)), [pcbIndexQuery.data]);

  const getUsedPins = useCallback(() => {
    // Pass 1: collect all usages per resolved pin
    interface PinEntry {
      rawPin: string;
      resolvedPin: string;
      field: string;
      usage: PinUsage;
    }
    const pinEntries = new Map<string, PinEntry[]>();

    for (const section of configState.document.sections) {
      const header = resolveHeader(section);
      for (const [key, value] of Object.entries(section.data)) {
        if ((key.endsWith("_pin") || key === "pin") && typeof value === "string" && value !== "") {
          const rawPin = value.replace(/^[!^~]*/, "");
          const resolvedPin = resolvePinAlias(rawPin, configState.boardPinAliases);
          const entry: PinEntry = { rawPin, resolvedPin, field: key, usage: { section: header, field: key } };
          const existing = pinEntries.get(resolvedPin);
          if (existing) {
            existing.push(entry);
          } else {
            pinEntries.set(resolvedPin, [entry]);
          }
        }
      }
    }

    // Pass 2: populate result, skipping pins where all usages are shared bus fields
    const usedPins = new Map<string, PinUsage>();
    for (const [, entries] of pinEntries) {
      const allShareable = entries.length > 1 && entries.every((e) => SHARED_BUS_PIN_FIELDS.has(e.field));
      if (allShareable) continue;

      for (const entry of entries) {
        usedPins.set(entry.rawPin, entry.usage);
        if (entry.resolvedPin !== entry.rawPin) {
          usedPins.set(entry.resolvedPin, entry.usage);
        }
      }
    }
    return usedPins;
  }, [configState.document, configState.boardPinAliases]);

  // Auto-populate board_pins when boards with aliases are loaded
  const prevBoardsRef = useRef<McuBoardInstance[]>([]);
  const configDocumentRef = useRef(configState.document);
  configDocumentRef.current = configState.document;

  // Auto-load board data when boardId changes
  const boardsNeedingData = state.boards
    .map((b, i) => ({ boardId: b.boardId, index: i }))
    .filter((b) => b.boardId && !state.boards[b.index].board);

  const boardDataQueries = useBoardDataQuery(boardsNeedingData);

  useEffect(
    function dispatchBoardDataEffect() {
      if (!boardDataQueries.data) return;
      for (const { index, board } of boardDataQueries.data) {
        dispatch({ type: "SET_BOARD_DATA", payload: { index, board } });
      }
    },
    [boardDataQueries.data],
  );

  // Sync MCU board associations to ConfigDocument for serialization
  useEffect(
    function syncMcuBoardsEffect() {
      const mcuBoards = state.boards.map((b) => ({
        boardId: b.boardId,
        alias: b.alias,
        ...(b.selectedMcu ? { selectedMcu: b.selectedMcu } : {}),
        ...(b.jumperSelections ? { jumperSelections: b.jumperSelections } : {}),
      }));
      configDispatch({ type: "SET_MCU_BOARDS", payload: mcuBoards });
    },
    [state.boards, configDispatch],
  );

  // Restore MCU boards from imported document when configEpoch changes
  const lastEpochRef = useRef(configState.configEpoch);

  const { configEpoch, document: configDocument } = configState;

  useEffect(
    function restoreBoardsOnDocumentLoadEffect() {
      if (configEpoch === lastEpochRef.current) return;
      lastEpochRef.current = configEpoch;

      if (configDocument.mcuBoards && configDocument.mcuBoards.length > 0) {
        // Imported document had board annotations — use them directly
        dispatch({ type: "RESTORE_BOARDS", payload: { boards: configDocument.mcuBoards } });
        return;
      }

      // Infer boards from MCU sections in the document
      const fallbackBoardId = "generic-stm32f446";
      const inferredBoards: { boardId: string; alias: string }[] = [];

      for (const section of configDocument.sections) {
        if (section.definitionId === "mcu") {
          inferredBoards.push({ boardId: fallbackBoardId, alias: "" });
        } else if (section.definitionId === "mcu_named" && section.instanceName) {
          const serial = section.data.serial;
          const isHostMcu = typeof serial === "string" && serial === "/tmp/klipper_host_mcu";
          const boardId = isHostMcu ? "generic-linux-mcu" : fallbackBoardId;
          inferredBoards.push({ boardId, alias: section.instanceName });
        }
      }

      if (inferredBoards.length > 0) {
        dispatch({ type: "RESTORE_BOARDS", payload: { boards: inferredBoards } });
      }
    },
    [configEpoch, configDocument],
  );

  // Sync board pin context for pin membership validation
  useEffect(
    function syncBoardPinContextEffect() {
      const contexts: BoardPinContext[] = state.boards
        .filter((b): b is McuBoardInstance & { board: McuBoard } => b.board !== null)
        .map((b) => ({
          alias: b.alias,
          mcu: b.selectedMcu ?? b.board.mcu,
          pins: b.board.pins,
          aliases: b.board.aliases ?? {},
        }));
      configDispatch({ type: "SET_BOARD_PIN_CONTEXT", payload: contexts });
    },
    [state.boards, configDispatch],
  );

  // Auto-populate board_pins when boards with aliases are loaded
  // Uses configDocumentRef to read document without depending on it,
  // since this effect only needs to react to board changes.
  useEffect(
    function autoPopulateBoardPinsEffect() {
      const prev = prevBoardsRef.current;
      prevBoardsRef.current = state.boards;

      const { sections } = configDocumentRef.current;

      for (const instance of state.boards) {
        if (!instance.board) continue;

        const prevInstance = prev.find((b) => b.alias === instance.alias && b.boardId === instance.boardId && b.board);
        if (prevInstance) continue; // Board data unchanged

        if (instance.board.aliases && Object.keys(instance.board.aliases).length > 0) {
          const aliasStr = Object.entries(instance.board.aliases)
            .map(([name, pin]) => `${name}=${pin}`)
            .join(",\n");

          // Check for existing auto-generated board_pins for this alias
          const existing = sections.find(
            (s) =>
              (s.definitionId === "board_pins" || s.definitionId === "board_pins_named") &&
              s.meta?._boardSource !== undefined &&
              (instance.alias === "" ? !s.data.mcu || s.data.mcu === "" : s.data.mcu === instance.alias),
          );

          if (existing && existing.meta?._boardSource === instance.board.id) {
            continue; // Already has correct board_pins
          }

          // Remove old auto-generated one if it exists
          if (existing) {
            const header =
              existing.definitionId === "board_pins" ? "board_pins" : `board_pins ${existing.instanceName}`;
            configDispatch({ type: "REMOVE_SECTION", payload: { header } });
          }

          const newSection: import("@klipperforge/klipper-config").SectionInstance = {
            definitionId: instance.alias === "" ? "board_pins" : "board_pins_named",
            ...(instance.alias !== "" && { instanceName: instance.alias }),
            data: {
              ...(instance.alias !== "" && { mcu: instance.alias }),
              aliases: aliasStr,
            },
            meta: { _boardSource: instance.board.id },
          };
          configDispatch({ type: "SET_SECTION", payload: newSection });
        } else {
          // Board has no aliases - remove any auto-generated board_pins for this MCU
          const autoGenerated = sections.find(
            (s) =>
              (s.definitionId === "board_pins" || s.definitionId === "board_pins_named") &&
              s.meta?._boardSource !== undefined &&
              (instance.alias === "" ? !s.data.mcu || s.data.mcu === "" : s.data.mcu === instance.alias),
          );
          if (autoGenerated) {
            const header =
              autoGenerated.definitionId === "board_pins" ? "board_pins" : `board_pins ${autoGenerated.instanceName}`;
            configDispatch({ type: "REMOVE_SECTION", payload: { header } });
          }
        }
      }

      // Handle removed boards - clean up their auto-generated board_pins
      for (const prevInstance of prev) {
        if (!prevInstance.board) continue;
        const stillExists = state.boards.some(
          (b) => b.alias === prevInstance.alias && b.boardId === prevInstance.boardId,
        );
        if (stillExists) continue;

        const autoGenerated = configDocumentRef.current.sections.find(
          (s) =>
            (s.definitionId === "board_pins" || s.definitionId === "board_pins_named") &&
            s.meta?._boardSource === prevInstance.board?.id,
        );
        if (autoGenerated) {
          const header =
            autoGenerated.definitionId === "board_pins" ? "board_pins" : `board_pins ${autoGenerated.instanceName}`;
          configDispatch({ type: "REMOVE_SECTION", payload: { header } });
        }
      }
    },
    [state.boards, configDispatch],
  );

  return (
    <McuContext.Provider value={{ state, dispatch, boardIndex, pcbBoardIds, imageBoardIds, getUsedPins }}>
      {children}
    </McuContext.Provider>
  );
}

export function useMcu() {
  const context = useContext(McuContext);
  if (!context) {
    throw new Error("useMcu must be used within a McuProvider");
  }
  return context;
}
