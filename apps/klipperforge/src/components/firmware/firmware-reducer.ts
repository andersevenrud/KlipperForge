import type { BoardEntry, BuildStatusResponse, PresetResponse } from "@/api/firmware-types";

type ViewState = "idle" | "loading" | "configuring" | "building" | "done" | "error";
type FirmwareTab = "build" | "flash-tool";

interface FirmwareState {
  activeTab: FirmwareTab;
  viewState: ViewState;
  boards: BoardEntry[];
  selectedBoardId: string | null;
  preset: PresetResponse | null;
  selectedInterface: string | null;
  selectedBootloaderOffset: string | null;
  options: Record<string, string>;
  buildStatus: BuildStatusResponse | null;
  logLines: string[];
  errorMessage: string | null;
  selectedMcuVariant: string | null;
  downloading: boolean;
  showFlashDialog: boolean;
  firmwareBlob: Uint8Array | null;
}

type FirmwareAction =
  | { type: "SET_TAB"; payload: FirmwareTab }
  | { type: "SET_BOARDS"; payload: BoardEntry[] }
  | { type: "SELECT_BOARD"; payload: { boardId: string } }
  | { type: "SELECT_MCU_VARIANT"; payload: { mcu: string | null } }
  | { type: "SET_PRESET"; payload: PresetResponse }
  | { type: "SET_VIEW_STATE"; payload: ViewState }
  | { type: "SELECT_INTERFACE"; payload: string }
  | { type: "SET_OPTION"; payload: { key: string; value: string } }
  | { type: "SET_OPTIONS"; payload: Record<string, string> }
  | { type: "START_BUILD" }
  | { type: "BUILD_SUBMITTED"; payload: BuildStatusResponse }
  | { type: "SET_BUILD_STATUS"; payload: BuildStatusResponse }
  | { type: "APPEND_LOG_LINES"; payload: string[] }
  | { type: "BUILD_DONE"; payload: { viewState: ViewState } }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_DOWNLOADING"; payload: boolean }
  | { type: "SHOW_FLASH_DIALOG"; payload: { firmware: Uint8Array } }
  | { type: "CLOSE_FLASH_DIALOG" }
  | { type: "RESET_BUILD" }
  | { type: "SET_BOOTLOADER_OFFSET"; payload: string };

export const initialFirmwareState: FirmwareState = {
  activeTab: "build",
  viewState: "idle",
  boards: [],
  selectedBoardId: null,
  preset: null,
  selectedInterface: null,
  selectedBootloaderOffset: null,
  options: {},
  buildStatus: null,
  logLines: [],
  errorMessage: null,
  selectedMcuVariant: null,
  downloading: false,
  showFlashDialog: false,
  firmwareBlob: null,
};

export function firmwareReducer(state: FirmwareState, action: FirmwareAction): FirmwareState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_BOARDS":
      return { ...state, boards: action.payload };
    case "SELECT_BOARD":
      return {
        ...state,
        selectedBoardId: action.payload.boardId,
        selectedMcuVariant: null,
        preset: null,
        selectedInterface: null,
        selectedBootloaderOffset: null,
        options: {},
        buildStatus: null,
        logLines: [],
        errorMessage: null,
        firmwareBlob: null,
      };
    case "SELECT_MCU_VARIANT":
      return {
        ...state,
        selectedMcuVariant: action.payload.mcu,
        preset: null,
        selectedInterface: null,
        selectedBootloaderOffset: null,
        options: {},
        buildStatus: null,
        logLines: [],
        errorMessage: null,
        firmwareBlob: null,
      };
    case "SET_PRESET":
      return { ...state, preset: action.payload };
    case "SET_VIEW_STATE":
      return { ...state, viewState: action.payload };
    case "SELECT_INTERFACE":
      return { ...state, selectedInterface: action.payload };
    case "SET_OPTION":
      return { ...state, options: { ...state.options, [action.payload.key]: action.payload.value } };
    case "SET_OPTIONS":
      return { ...state, options: action.payload };
    case "START_BUILD":
      return {
        ...state,
        viewState: "building",
        errorMessage: null,
        buildStatus: null,
        logLines: [],
        firmwareBlob: null,
      };
    case "BUILD_SUBMITTED":
      return { ...state, buildStatus: action.payload };
    case "SET_BUILD_STATUS":
      return { ...state, buildStatus: action.payload };
    case "APPEND_LOG_LINES":
      return { ...state, logLines: [...state.logLines, ...action.payload] };
    case "BUILD_DONE":
      return { ...state, viewState: action.payload.viewState };
    case "SET_ERROR":
      return { ...state, errorMessage: action.payload, viewState: "error" };
    case "SET_DOWNLOADING":
      return { ...state, downloading: action.payload };
    case "SHOW_FLASH_DIALOG":
      return { ...state, firmwareBlob: action.payload.firmware, showFlashDialog: true };
    case "CLOSE_FLASH_DIALOG":
      return { ...state, showFlashDialog: false };
    case "RESET_BUILD":
      return {
        ...state,
        preset: null,
        selectedInterface: null,
        selectedBootloaderOffset: null,
        options: {},
        buildStatus: null,
        logLines: [],
        errorMessage: null,
        firmwareBlob: null,
      };
    case "SET_BOOTLOADER_OFFSET":
      return { ...state, selectedBootloaderOffset: action.payload };
    default:
      return state;
  }
}
