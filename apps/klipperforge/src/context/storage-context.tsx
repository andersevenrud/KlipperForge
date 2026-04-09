import { createContext, type ReactNode, useCallback, useContext, useMemo, useReducer } from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface StorageState {
  configId: string | null;
  configName: string | null;
  currentRevision: number | null;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
}

type StorageAction =
  | { type: "MARK_SAVED"; payload: { id: string; name: string; revision: number } }
  | { type: "MARK_DIRTY" }
  | { type: "SET_SAVING" }
  | { type: "SET_ERROR" }
  | { type: "RENAME"; payload: { name: string } }
  | { type: "CLEAR" };

interface StorageContextValue {
  state: StorageState;
  markSaved: (id: string, name: string, revision: number) => void;
  markDirty: () => void;
  setSaving: () => void;
  setError: () => void;
  rename: (name: string) => void;
  clear: () => void;
}

const initialState: StorageState = {
  configId: null,
  configName: null,
  currentRevision: null,
  isDirty: false,
  saveStatus: "idle",
  lastSavedAt: null,
};

function storageReducer(state: StorageState, action: StorageAction): StorageState {
  switch (action.type) {
    case "MARK_SAVED":
      return {
        ...state,
        configId: action.payload.id,
        configName: action.payload.name,
        currentRevision: action.payload.revision,
        isDirty: false,
        saveStatus: "saved",
        lastSavedAt: new Date().toISOString(),
      };
    case "MARK_DIRTY":
      return {
        ...state,
        isDirty: true,
        saveStatus: state.saveStatus === "saved" ? "idle" : state.saveStatus,
      };
    case "SET_SAVING":
      return { ...state, saveStatus: "saving" };
    case "SET_ERROR":
      return { ...state, saveStatus: "error" };
    case "RENAME":
      return { ...state, configName: action.payload.name };
    case "CLEAR":
      return initialState;
    default:
      return state;
  }
}

const StorageContext = createContext<StorageContextValue | null>(null);

interface StorageProviderProps {
  children: ReactNode;
}

export function StorageProvider({ children }: StorageProviderProps) {
  const [state, dispatch] = useReducer(storageReducer, initialState);

  const markSaved = useCallback((id: string, name: string, revision: number) => {
    dispatch({ type: "MARK_SAVED", payload: { id, name, revision } });
  }, []);

  const markDirty = useCallback(() => {
    dispatch({ type: "MARK_DIRTY" });
  }, []);

  const setSaving = useCallback(() => {
    dispatch({ type: "SET_SAVING" });
  }, []);

  const setError = useCallback(() => {
    dispatch({ type: "SET_ERROR" });
  }, []);

  const rename = useCallback((name: string) => {
    dispatch({ type: "RENAME", payload: { name } });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value = useMemo(
    () => ({ state, markSaved, markDirty, setSaving, setError, rename, clear }),
    [state, markSaved, markDirty, setSaving, setError, rename, clear],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage(): StorageContextValue {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
