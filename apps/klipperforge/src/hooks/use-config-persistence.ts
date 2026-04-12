import { exportProject, importProject } from "@klipperforge/klipper-config";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useConfig } from "@/context/config-context";
import { useConfigStorage } from "@/context/config-storage-context";
import { useStorage } from "@/context/storage-context";
import { loadDraft, saveDraft } from "@/lib/draft-storage";
import { featureFlags } from "@/lib/feature-flags";
import type { TimerId } from "@/types";

export function useConfigPersistence() {
  const { state: configState, dispatch } = useConfig();
  const storage = useStorage();
  const { adapter } = useConfigStorage();
  const [searchParams, setSearchParams] = useSearchParams();

  const mountedRef = useRef(false);
  const lastSyncedConfigIdRef = useRef<string | null>(null);
  const draftTimerRef = useRef<TimerId | null>(null);

  // A) On mount — restore remote config from URL param, or restore draft
  // storage metadata (configId/revision) so the remote-save flow still works
  // after a refresh. The draft's document has already been loaded
  // synchronously by ConfigProvider's reducer lazy-init.
  useEffect(
    function restoreConfigOnMountEffect() {
      if (mountedRef.current) return;
      mountedRef.current = true;

      const configId = searchParams.get("config");

      if (configId && featureFlags.configStorage) {
        lastSyncedConfigIdRef.current = configId;
        adapter.fetchConfig(configId).then(
          (config) => {
            const project = JSON.parse(config.latestRevision.document);
            const imported = importProject(project);
            // Remote fetch is authoritative and matches the server — clean.
            dispatch({ type: "LOAD_DOCUMENT", payload: { document: imported.document, dirty: false } });
            storage.markSaved(config.id, config.name, config.currentRevision);
          },
          () => {
            // Config not found or fetch failed — clear URL param, fall through to draft metadata
            setSearchParams(
              (prev) => {
                prev.delete("config");
                return prev;
              },
              { replace: true },
            );
            restoreDraftMetadata();
          },
        );
        return;
      }

      restoreDraftMetadata();

      function restoreDraftMetadata() {
        const draft = loadDraft();
        if (!draft) return;
        if (draft.configId && draft.configName && draft.currentRevision !== null) {
          lastSyncedConfigIdRef.current = draft.configId;
          storage.markSaved(draft.configId, draft.configName, draft.currentRevision);
        }
      }
      // mountedRef guard ensures this only runs once — deps are all stable references
    },
    [adapter, dispatch, searchParams, setSearchParams, storage],
  );

  // B) Sync configId changes to URL
  useEffect(
    function syncConfigIdToUrlEffect() {
      if (!featureFlags.configStorage) return;

      const currentId = storage.state.configId;

      // Skip if this is the initial sync from mount restore
      if (currentId === lastSyncedConfigIdRef.current) return;
      lastSyncedConfigIdRef.current = currentId;

      setSearchParams(
        (prev) => {
          if (currentId) {
            prev.set("config", currentId);
          } else {
            prev.delete("config");
          }
          return prev;
        },
        { replace: true },
      );
    },
    [storage.state.configId, setSearchParams],
  );

  // C) Auto-save draft on document changes (debounced 1s)
  useEffect(
    function autoDraftSaveEffect() {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }

      draftTimerRef.current = setTimeout(() => {
        const project = exportProject(configState.document);
        saveDraft({
          document: JSON.stringify(project),
          configId: storage.state.configId,
          configName: storage.state.configName,
          currentRevision: storage.state.currentRevision,
          savedAt: new Date().toISOString(),
          isDirty: configState.isDirty,
        });
      }, 1000);

      return () => {
        if (draftTimerRef.current) {
          clearTimeout(draftTimerRef.current);
        }
      };
    },
    [
      configState.document,
      configState.isDirty,
      storage.state.configId,
      storage.state.configName,
      storage.state.currentRevision,
    ],
  );

  // D) beforeunload — last-chance save + unsaved warning
  useEffect(
    function beforeUnloadEffect() {
      function handleBeforeUnload(e: BeforeUnloadEvent) {
        const project = exportProject(configState.document);
        saveDraft({
          document: JSON.stringify(project),
          configId: storage.state.configId,
          configName: storage.state.configName,
          currentRevision: storage.state.currentRevision,
          savedAt: new Date().toISOString(),
          isDirty: configState.isDirty,
        });

        if (configState.isDirty) {
          e.preventDefault();
        }
      }

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    },
    [
      configState.document,
      configState.isDirty,
      storage.state.configId,
      storage.state.configName,
      storage.state.currentRevision,
    ],
  );
}
