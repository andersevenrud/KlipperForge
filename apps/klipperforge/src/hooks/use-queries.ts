import type { DocIndices } from "@klipperforge/printer-data";
import {
  loadDocIndices,
  loadMcuBoard,
  loadMcuBoardIndex,
  loadPcbLayoutIndex,
  loadPrinterIndex,
} from "@klipperforge/printer-data";
import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import type { ConfigListResponse } from "@/api/config-storage-types";
import { useConfigStorage } from "@/context/config-storage-context";

interface BoardDataRequest {
  index: number;
  boardId: string;
}

interface DocEntityResult<T> {
  entity: T;
  hasImage: boolean;
}

interface DocIndexEntry {
  id: string;
  hasImage?: boolean;
}

const BOARD_INDEX_QUERY_KEY = "loadMcuBoardIndex";
const PCB_LAYOUT_INDEX_QUERY_KEY = "loadPcbLayoutIndex";
const PRINTER_INDEX_QUERY_KEY = "loadPrinterIndex";
const DOC_INDICES_QUERY_KEY = "loadDocIndices";
const BOARD_DATA_QUERY_KEY = "loadBoardData";
const CONFIG_LIST_QUERY_KEY = "configList";
const _SHARED_CONFIG_QUERY_KEY = "sharedConfig";

export const useBoardIndexQuery = () =>
  useSuspenseQuery({ queryKey: [BOARD_INDEX_QUERY_KEY], queryFn: loadMcuBoardIndex });

export const usePcbLayoutIndexQuery = () =>
  useSuspenseQuery({ queryKey: [PCB_LAYOUT_INDEX_QUERY_KEY], queryFn: loadPcbLayoutIndex });

export const usePrinterIndexQuery = () =>
  useSuspenseQuery({ queryKey: [PRINTER_INDEX_QUERY_KEY], queryFn: loadPrinterIndex });

export const useDocIndicesQuery = () =>
  useSuspenseQuery({ queryKey: [DOC_INDICES_QUERY_KEY], queryFn: loadDocIndices });

export function useDocDataQuery<T>(loader: (id: string) => Promise<T>, id: string): T {
  const query = useSuspenseQuery({
    queryKey: [loader.name, id],
    queryFn: () => loader(id),
  });

  return query.data;
}

export function useDocDataMultipleQuery<T>(loader: (id: string) => Promise<T>, ids: string[]): T[] {
  const queries = useSuspenseQueries({
    queries: ids.map((id) => ({
      queryKey: [loader.name, id],
      queryFn: () => loader(id),
    })),
  });

  return queries.map((q) => q.data);
}

export function useDocEntityQuery<T>(
  loader: (id: string) => Promise<T>,
  indexKey: keyof DocIndices,
  id: string,
): DocEntityResult<T> {
  const entity = useDocDataQuery(loader, id);
  const { data: indices } = useDocIndicesQuery();
  const entries = indices[indexKey] as readonly DocIndexEntry[];
  const hasImage = entries.find((entry) => entry.id === id)?.hasImage ?? false;
  return { entity, hasImage };
}

export function useOptionalDocDataQuery<T>(loader: (id: string) => Promise<T>, id: string | undefined): T | null {
  const resolvedId = id ?? "";
  const query = useQuery({
    queryKey: [loader.name, resolvedId],
    queryFn: () => loader(resolvedId),
    enabled: !!id,
  });

  return query.data ?? null;
}

export function useBoardDataQuery(boards: BoardDataRequest[]) {
  return useQuery({
    queryKey: [BOARD_DATA_QUERY_KEY, boards.map((b) => b.boardId).join(",")],
    queryFn: async () =>
      Promise.all(
        boards.map(async (b) => ({
          index: b.index,
          board: await loadMcuBoard(b.boardId),
        })),
      ),
    enabled: boards.length > 0,
  });
}

export function useConfigListQuery(enabled: boolean) {
  const { adapter, mode } = useConfigStorage();
  return useQuery<ConfigListResponse>({
    queryKey: [CONFIG_LIST_QUERY_KEY, mode],
    queryFn: () => adapter.fetchConfigList(),
    enabled,
  });
}
