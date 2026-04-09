import { canFlashDfu, canFlashSerial } from "@klipperforge/dfu";
import { Cpu, Loader2, Wrench, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  downloadBuild,
  fetchBoardPresets,
  fetchBoards,
  fetchBuildStatus,
  fetchKlipperVersion,
  streamBuildLogs,
  submitBuild,
} from "@/api/firmware";
import type { FlashMethod, KlipperVersionInfo } from "@/api/firmware-types";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { featureFlags } from "@/lib/feature-flags";
import { downloadBlob, getErrorMessage } from "@/lib/utils";
import type { TimerId } from "@/types";
import { BoardSelector } from "./BoardSelector";
import { BrowserFlashSupport } from "./BrowserFlashSupport";
import { BuildLog } from "./BuildLog";
import { BuildStatus } from "./BuildStatus";
import { FlashDialog } from "./FlashDialog";
import { firmwareReducer, initialFirmwareState } from "./firmware-reducer";
import { InterfaceSelector } from "./InterfaceSelector";
import { OptionsPanel } from "./OptionsPanel";
import { StandaloneFlashTool } from "./StandaloneFlashTool";

interface FirmwareViewProps {
  onBuildStart?: () => void;
  onBuildFail?: () => void;
}

export function FirmwareView({ onBuildStart, onBuildFail }: FirmwareViewProps) {
  const [state, dispatch] = useReducer(firmwareReducer, initialFirmwareState);
  const [klipperVersion, setKlipperVersion] = useState<KlipperVersionInfo | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const logBufferRef = useRef<string[]>([]);
  const logFlushTimerRef = useRef<TimerId | null>(null);

  const selectedBoard = useMemo(
    () => state.boards.find((b) => b.id === state.selectedBoardId),
    [state.boards, state.selectedBoardId],
  );

  const flashSupported = useMemo(() => {
    if (!state.preset?.flashMethods) return false;
    const methods = state.preset.flashMethods;
    return (methods.includes("dfu") && canFlashDfu()) || (methods.includes("serial") && canFlashSerial());
  }, [state.preset?.flashMethods]);

  const currentFlashAddress = useMemo(() => {
    if (!state.preset || !state.selectedBootloaderOffset) return undefined;
    const offset = state.preset.bootloaderOffsets.find((o) => o.id === state.selectedBootloaderOffset);
    return offset?.flashAddress;
  }, [state.preset, state.selectedBootloaderOffset]);

  const flushLogBuffer = useCallback(() => {
    if (logBufferRef.current.length === 0) return;
    const batch = logBufferRef.current;
    logBufferRef.current = [];
    dispatch({ type: "APPEND_LOG_LINES", payload: batch });
  }, []);

  const stopStream = useCallback(() => {
    if (logFlushTimerRef.current) {
      clearInterval(logFlushTimerRef.current);
      logFlushTimerRef.current = null;
    }
    flushLogBuffer();
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, [flushLogBuffer]);

  const loadPreset = useCallback(async (boardId: string, mcu?: string) => {
    try {
      dispatch({ type: "SET_VIEW_STATE", payload: "loading" });
      const presetData = await fetchBoardPresets(boardId, mcu);
      dispatch({ type: "SET_PRESET", payload: presetData });
      dispatch({ type: "SET_VIEW_STATE", payload: "configuring" });
      if (presetData.interfaces.length === 1) {
        dispatch({ type: "SELECT_INTERFACE", payload: presetData.interfaces[0].id });
        sessionStorage.setItem("firmware:interface", presetData.interfaces[0].id);
      }
      if (presetData.bootloaderOffsets.length > 0) {
        dispatch({ type: "SET_BOOTLOADER_OFFSET", payload: presetData.bootloaderOffsets[0].id });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: getErrorMessage(err, "Failed to load presets") });
    }
  }, []);

  const connectStream = useCallback(
    (jobId: string) => {
      stopStream();
      logFlushTimerRef.current = setInterval(flushLogBuffer, 100);
      const close = streamBuildLogs(jobId, {
        onLog(line) {
          logBufferRef.current.push(line);
        },
        onStatus(status) {
          dispatch({ type: "SET_BUILD_STATUS", payload: status });
        },
        onDone(finalStatus) {
          if (logFlushTimerRef.current) {
            clearInterval(logFlushTimerRef.current);
            logFlushTimerRef.current = null;
          }
          flushLogBuffer();
          sessionStorage.removeItem("firmware:jobId");
          if (finalStatus === "completed") {
            dispatch({ type: "BUILD_DONE", payload: { viewState: "done" } });
          } else {
            dispatch({ type: "BUILD_DONE", payload: { viewState: "error" } });
            onBuildFail?.();
          }
        },
        onError() {
          // SSE connection lost — not necessarily an error, build may have finished
        },
      });
      cleanupRef.current = close;
    },
    [stopStream, flushLogBuffer, onBuildFail],
  );

  const handleBoardSelect = useCallback(
    async (boardId: string) => {
      dispatch({ type: "SELECT_BOARD", payload: { boardId } });
      stopStream();

      sessionStorage.setItem("firmware:boardId", boardId);
      sessionStorage.removeItem("firmware:mcuVariant");
      sessionStorage.removeItem("firmware:interface");
      sessionStorage.removeItem("firmware:options");

      await loadPreset(boardId);
    },
    [stopStream, loadPreset],
  );

  const handleMcuVariantSelect = useCallback(
    async (mcu: string) => {
      const isDefault = mcu === selectedBoard?.mcu;
      dispatch({ type: "SELECT_MCU_VARIANT", payload: { mcu: isDefault ? null : mcu } });
      stopStream();

      if (isDefault) {
        sessionStorage.removeItem("firmware:mcuVariant");
      } else {
        sessionStorage.setItem("firmware:mcuVariant", mcu);
      }
      sessionStorage.removeItem("firmware:interface");
      sessionStorage.removeItem("firmware:options");

      if (!state.selectedBoardId) return;

      await loadPreset(state.selectedBoardId, isDefault ? undefined : mcu);
    },
    [state.selectedBoardId, selectedBoard?.mcu, stopStream, loadPreset],
  );

  const handleInterfaceSelect = useCallback((interfaceId: string) => {
    dispatch({ type: "SELECT_INTERFACE", payload: interfaceId });
    sessionStorage.setItem("firmware:interface", interfaceId);
  }, []);

  const handleOptionChange = useCallback(
    (key: string, value: string) => {
      dispatch({ type: "SET_OPTION", payload: { key, value } });
      sessionStorage.setItem("firmware:options", JSON.stringify({ ...state.options, [key]: value }));
    },
    [state.options],
  );

  const handleBuild = useCallback(async () => {
    if (!state.selectedBoardId || !state.selectedInterface) return;

    dispatch({ type: "START_BUILD" });
    stopStream();

    try {
      const result = await submitBuild({
        boardId: state.selectedBoardId,
        interface: state.selectedInterface,
        options: state.options,
        ...(state.selectedMcuVariant ? { mcuOverride: state.selectedMcuVariant } : {}),
      });

      dispatch({
        type: "BUILD_SUBMITTED",
        payload: {
          jobId: result.jobId,
          status: result.status === "cached" ? "completed" : "queued",
          progress: result.status === "cached" ? "Cache hit" : null,
          error: null,
          downloadReady: result.status === "cached",
          cached: result.status === "cached",
        },
      });

      if (result.status === "cached") {
        sessionStorage.removeItem("firmware:jobId");
        dispatch({ type: "BUILD_DONE", payload: { viewState: "done" } });
        return;
      }

      sessionStorage.setItem("firmware:jobId", result.jobId);
      onBuildStart?.();
      connectStream(result.jobId);
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: getErrorMessage(err, "Failed to submit build") });
    }
  }, [
    state.selectedBoardId,
    state.selectedInterface,
    state.options,
    state.selectedMcuVariant,
    stopStream,
    connectStream,
    onBuildStart,
  ]);

  const handleDownload = useCallback(async () => {
    if (!state.buildStatus?.jobId) return;

    dispatch({ type: "SET_DOWNLOADING", payload: true });
    try {
      const blob = await downloadBuild(state.buildStatus.jobId);
      downloadBlob(blob, state.preset?.flashFilename ?? "firmware.bin");
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: getErrorMessage(err, "Download failed") });
    } finally {
      dispatch({ type: "SET_DOWNLOADING", payload: false });
    }
  }, [state.buildStatus?.jobId, state.preset?.flashFilename]);

  const handleFlash = useCallback(async () => {
    if (!state.buildStatus?.jobId) return;

    try {
      const blob = await downloadBuild(state.buildStatus.jobId);
      const arrayBuffer = await blob.arrayBuffer();
      dispatch({ type: "SHOW_FLASH_DIALOG", payload: { firmware: new Uint8Array(arrayBuffer) } });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: getErrorMessage(err, "Failed to fetch firmware for flashing") });
    }
  }, [state.buildStatus?.jobId]);

  useEffect(function loadBoardsEffect() {
    async function load() {
      try {
        const data = await fetchBoards();
        dispatch({ type: "SET_BOARDS", payload: data.boards });
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to load board list" });
      }
    }
    load();
  }, []);

  useEffect(function loadKlipperVersionEffect() {
    async function load() {
      try {
        setKlipperVersion(await fetchKlipperVersion());
      } catch {
        // version info is non-critical
      }
    }
    load();
  }, []);

  useEffect(
    function cleanupStreamEffect() {
      return stopStream;
    },
    [stopStream],
  );

  useEffect(
    function restoreBuildStateEffect() {
      const savedJobId = sessionStorage.getItem("firmware:jobId");
      if (!savedJobId) return;

      let cancelled = false;

      async function restore(jobId: string) {
        try {
          const status = await fetchBuildStatus(jobId);
          if (cancelled) return;
          dispatch({ type: "SET_BUILD_STATUS", payload: status });

          switch (status.status) {
            case "queued":
            case "building":
              dispatch({ type: "SET_VIEW_STATE", payload: "building" });
              connectStream(jobId);
              break;
            case "completed":
              dispatch({ type: "SET_VIEW_STATE", payload: "done" });
              break;
            case "failed":
              dispatch({ type: "SET_ERROR", payload: status.error ?? "Build failed" });
              break;
          }
        } catch {
          if (!cancelled) {
            sessionStorage.removeItem("firmware:jobId");
          }
        }
      }
      restore(savedJobId);

      return () => {
        cancelled = true;
      };
    },
    [connectStream],
  );

  useEffect(function restoreFormStateEffect() {
    const savedBoardId = sessionStorage.getItem("firmware:boardId");
    if (!savedBoardId) return;

    const savedMcuVariant = sessionStorage.getItem("firmware:mcuVariant");
    const hasActiveBuild = sessionStorage.getItem("firmware:jobId") !== null;
    let cancelled = false;

    dispatch({ type: "SELECT_BOARD", payload: { boardId: savedBoardId } });
    if (savedMcuVariant) {
      dispatch({ type: "SELECT_MCU_VARIANT", payload: { mcu: savedMcuVariant } });
    }
    if (!hasActiveBuild) {
      dispatch({ type: "SET_VIEW_STATE", payload: "loading" });
    }

    async function restore(boardId: string, mcuVariant: string | null) {
      try {
        const presetData = await fetchBoardPresets(boardId, mcuVariant ?? undefined);
        if (cancelled) return;
        dispatch({ type: "SET_PRESET", payload: presetData });
        if (!hasActiveBuild) {
          dispatch({ type: "SET_VIEW_STATE", payload: "configuring" });
        }

        const savedInterface = sessionStorage.getItem("firmware:interface");
        if (savedInterface) {
          dispatch({ type: "SELECT_INTERFACE", payload: savedInterface });
        } else if (presetData.interfaces.length === 1) {
          dispatch({ type: "SELECT_INTERFACE", payload: presetData.interfaces[0].id });
        }

        if (presetData.bootloaderOffsets.length > 0) {
          dispatch({ type: "SET_BOOTLOADER_OFFSET", payload: presetData.bootloaderOffsets[0].id });
        }

        const savedOptions = sessionStorage.getItem("firmware:options");
        if (savedOptions) {
          try {
            dispatch({ type: "SET_OPTIONS", payload: JSON.parse(savedOptions) });
          } catch {
            // ignore malformed data
          }
        }
      } catch {
        if (!cancelled && !hasActiveBuild) {
          dispatch({ type: "SET_VIEW_STATE", payload: "idle" });
        }
      }
    }
    restore(savedBoardId, savedMcuVariant);

    return () => {
      cancelled = true;
    };
  }, []);

  const isBuilding = state.viewState === "building";
  const isUf2Board = state.preset?.flashMethods?.includes("uf2");

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Tab bar */}
        {featureFlags.browserFlashTool && (
          <div className="flex gap-1 rounded-md border border-border bg-muted/50 p-1">
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                state.activeTab === "build" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => dispatch({ type: "SET_TAB", payload: "build" })}
            >
              <Wrench className="size-4" />
              Build
            </button>
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                state.activeTab === "flash-tool"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => dispatch({ type: "SET_TAB", payload: "flash-tool" })}
            >
              <Zap className="size-4" />
              Flash Tool
            </button>
          </div>
        )}

        {featureFlags.browserFlashTool && state.activeTab === "flash-tool" ? (
          <StandaloneFlashTool />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Cpu className="size-6 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Firmware Builder</h2>
                <p className="text-sm text-muted-foreground">Compile Klipper firmware for your MCU board</p>
                {klipperVersion && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    Klipper{klipperVersion.version ? ` ${klipperVersion.version}` : ""} ({klipperVersion.commitShort}){" "}
                    &middot; {new Date(klipperVersion.commitDate ?? klipperVersion.sourceDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <BoardSelector
              boards={state.boards}
              selectedBoardId={state.selectedBoardId}
              onSelect={handleBoardSelect}
              disabled={isBuilding}
            />

            {selectedBoard?.mcuVariants?.length ? (
              <div className="space-y-2">
                <FieldWrapper name="MCU Variant" disabled={isBuilding}>
                  {({ id, disabled }) => (
                    <Select
                      value={state.selectedMcuVariant ?? selectedBoard.mcu}
                      onValueChange={handleMcuVariantSelect}
                      disabled={disabled}
                    >
                      <SelectTrigger id={id} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={selectedBoard.mcu}>{selectedBoard.mcu}</SelectItem>
                        {selectedBoard.mcuVariants?.map((variant) => (
                          <SelectItem key={variant} value={variant}>
                            {variant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FieldWrapper>
              </div>
            ) : null}

            {state.viewState === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading board configuration...
              </div>
            )}

            {state.preset && (
              <>
                <InterfaceSelector
                  preset={state.preset}
                  selectedInterface={state.selectedInterface}
                  onSelect={handleInterfaceSelect}
                  disabled={isBuilding}
                />

                <OptionsPanel
                  preset={state.preset}
                  selectedInterface={state.selectedInterface}
                  options={state.options}
                  onOptionChange={handleOptionChange}
                  disabled={isBuilding}
                />

                <Button className="w-full" onClick={handleBuild} disabled={!state.selectedInterface || isBuilding}>
                  {isBuilding ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Building...
                    </>
                  ) : (
                    "Build Firmware"
                  )}
                </Button>
              </>
            )}

            {state.buildStatus && (
              <BuildStatus
                status={state.buildStatus}
                onDownload={handleDownload}
                onFlash={handleFlash}
                downloading={state.downloading}
                flashSupported={flashSupported && !isUf2Board}
              />
            )}

            {/* RP2040 UF2 instructions */}
            {isUf2Board && state.buildStatus?.status === "completed" && (
              <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-4 text-sm">
                <p className="font-medium">RP2040 Flashing Instructions</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                  <li>Download the .uf2 file using the button above.</li>
                  <li>Hold the BOOTSEL button on your board.</li>
                  <li>Connect the board to your computer via USB.</li>
                  <li>Release BOOTSEL — a &quot;RPI-RP2&quot; drive will appear.</li>
                  <li>Drag the .uf2 file onto the RPI-RP2 drive.</li>
                </ol>
              </div>
            )}

            {/* Browser flash support banner */}
            {state.preset?.flashMethods &&
              !state.preset.flashMethods.includes("uf2") &&
              state.buildStatus?.status === "completed" && <BrowserFlashSupport />}

            {state.logLines.length > 0 && <BuildLog lines={state.logLines} />}

            {state.errorMessage && state.viewState === "error" && !state.buildStatus && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {state.errorMessage}
              </div>
            )}
          </>
        )}

        {/* Flash dialog */}
        {state.showFlashDialog && state.firmwareBlob && state.preset && currentFlashAddress && (
          <FlashDialog
            firmware={state.firmwareBlob}
            flashAddress={currentFlashAddress}
            mcuFamily={state.preset.mcuFamily}
            flashMethods={(state.preset.flashMethods ?? []).filter(
              (m): m is Exclude<FlashMethod, "uf2"> => m !== "uf2",
            )}
            boardFlash={selectedBoard?.flash}
            onClose={() => dispatch({ type: "CLOSE_FLASH_DIALOG" })}
          />
        )}
      </div>
    </div>
  );
}
