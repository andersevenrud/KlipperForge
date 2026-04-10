import { ArrowLeftRight, BookOpen, PanelLeft } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useSearchParams } from "react-router";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { NotFound, NotFoundBoundary } from "@/components/NotFound";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { DocAccessoryPage } from "./DocAccessoryPage";
import { DocBoardPage } from "./DocBoardPage";
import { DocComparisonView } from "./DocComparisonView";
import { DocDisplayPage } from "./DocDisplayPage";
import { DocExtruderPage } from "./DocExtruderPage";
import { DocFanPage } from "./DocFanPage";
import { DocFilamentPage } from "./DocFilamentPage";
import { DocHotendPage } from "./DocHotendPage";
import { DocMmuPage } from "./DocMmuPage";
import { DocPowerSupplyPage } from "./DocPowerSupplyPage";
import { DocPrinterPage } from "./DocPrinterPage";
import { DocProbePage } from "./DocProbePage";
import { DocSidebar } from "./DocSidebar";
import { DocStepperDriverPage } from "./DocStepperDriverPage";
import { DocStepperMotorPage } from "./DocStepperMotorPage";
import { DocThermistorPage } from "./DocThermistorPage";
import { DocToolheadPage } from "./DocToolheadPage";
import { CATEGORY_PARAM_KEY } from "./doc-shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocCategory =
  | "accessories"
  | "displays"
  | "extruders"
  | "fans"
  | "filaments"
  | "hotends"
  | "mcu-boards"
  | "mmus"
  | "power-supplies"
  | "printers"
  | "probes"
  | "stepper-drivers"
  | "stepper-motors"
  | "thermistors"
  | "toolheads";

export interface DocSelection {
  category: DocCategory;
  itemId: string;
}

interface CompareState {
  category: DocCategory;
  itemIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PARAM_TO_CATEGORY: Record<string, DocCategory> = {
  board: "mcu-boards",
  display: "displays",
  printer: "printers",
  driver: "stepper-drivers",
  motor: "stepper-motors",
  probe: "probes",
  fan: "fans",
  thermistor: "thermistors",
  extruder: "extruders",
  hotend: "hotends",
  mmu: "mmus",
  psu: "power-supplies",
  accessory: "accessories",
  filament: "filaments",
  toolhead: "toolheads",
};

function resolveSelectionFromUrl(params: URLSearchParams): DocSelection | null {
  for (const [paramKey, category] of Object.entries(PARAM_TO_CATEGORY)) {
    const value = params.get(paramKey);
    if (value) return { category, itemId: value };
  }
  return null;
}

const DOC_CATEGORIES: DocCategory[] = [
  "accessories",
  "displays",
  "extruders",
  "fans",
  "filaments",
  "hotends",
  "mcu-boards",
  "mmus",
  "power-supplies",
  "printers",
  "probes",
  "stepper-drivers",
  "stepper-motors",
  "thermistors",
  "toolheads",
];

function isDocCategory(value: string): value is DocCategory {
  return (DOC_CATEGORIES as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentationView() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selection, setSelection] = useState<DocSelection | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Compare state
  const [compareMode, setCompareMode] = useState(false);
  const [comparePending, setComparePending] = useState<string[]>([]);
  const [compareCategory, setCompareCategory] = useState<DocCategory | null>(null);
  const [compareItems, setCompareItems] = useState<CompareState | null>(null);

  // Initialize compare state and selection from URL
  const initializedRef = useRef(false);
  useEffect(function initFromUrlEffect() {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const compareParam = params.get("compare");
    const idsParam = params.get("ids");
    if (compareParam && idsParam && isDocCategory(compareParam)) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length >= 2) {
        setCompareItems({ category: compareParam, itemIds: ids });
        setCompareMode(true);
        setCompareCategory(compareParam);
        setComparePending(ids);
        return;
      }
    }

    const initial = resolveSelectionFromUrl(params);
    if (initial) setSelection(initial);
  }, []);

  useEffect(
    function selectFromUrlEffect() {
      if (!initializedRef.current) return;
      const sel = resolveSelectionFromUrl(searchParams);
      if (sel) setSelection(sel);
    },
    [searchParams],
  );

  const handleSelect = useCallback(
    (sel: DocSelection) => {
      setSelection(sel);
      const paramKey = CATEGORY_PARAM_KEY[sel.category];
      setSearchParams({ [paramKey]: sel.itemId }, { replace: true });
      if (isMobile) setSidebarOpen(false);
    },
    [setSearchParams, isMobile],
  );

  const handleCompareModeToggle = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) {
        setComparePending([]);
        setCompareCategory(null);
        setCompareItems(null);
      }
      return !prev;
    });
    // Update URL outside the state updater to avoid calling setSearchParams during render
    if (compareMode) {
      setSearchParams({}, { replace: true });
    }
  }, [compareMode, setSearchParams]);

  const handleCompareItemToggle = useCallback(
    (category: DocCategory, itemId: string) => {
      const cat = compareCategory ?? category;
      if (!compareCategory) setCompareCategory(category);

      const next = comparePending.includes(itemId)
        ? comparePending.filter((id) => id !== itemId)
        : [...comparePending, itemId];

      setComparePending(next);
      if (next.length === 0) setCompareCategory(null);

      if (next.length >= 2) {
        setCompareItems({ category: cat, itemIds: next });
        setSearchParams({ compare: cat, ids: next.join(",") }, { replace: true });
      } else {
        setCompareItems(null);
        setSearchParams({}, { replace: true });
      }
    },
    [compareCategory, comparePending, setSearchParams],
  );

  const handleCompareExit = useCallback(() => {
    setCompareItems(null);
    setCompareMode(false);
    setComparePending([]);
    setCompareCategory(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleCompareRemoveItem = useCallback(
    (itemId: string) => {
      if (!compareItems || compareItems.itemIds.length <= 2) return;
      const nextIds = compareItems.itemIds.filter((id) => id !== itemId);
      setCompareItems({ category: compareItems.category, itemIds: nextIds });
      setComparePending(nextIds);
      setSearchParams({ compare: compareItems.category, ids: nextIds.join(",") }, { replace: true });
    },
    [compareItems, setSearchParams],
  );

  const sidebar = (
    <DocSidebar
      selection={selection}
      onSelect={handleSelect}
      compareMode={compareMode}
      compareCategory={compareCategory}
      comparePendingIds={comparePending}
      onCompareModeToggle={handleCompareModeToggle}
      onCompareItemToggle={handleCompareItemToggle}
    />
  );

  const handleClearSelection = useCallback(() => {
    setSelection(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const content = compareItems ? (
    <DocComparisonView
      category={compareItems.category}
      itemIds={compareItems.itemIds}
      onExit={handleCompareExit}
      onRemoveItem={handleCompareRemoveItem}
    />
  ) : compareMode ? (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <ArrowLeftRight className="text-muted-foreground size-10" />
      <p className="text-muted-foreground text-sm">Select at least two items from any category to compare.</p>
    </div>
  ) : (
    <NotFoundBoundary
      resetKey={selection?.itemId}
      fallback={
        <NotFound
          description={
            selection
              ? `No ${selection.category.replace(/-/g, " ")} documentation exists for "${selection.itemId}".`
              : "The requested documentation page could not be found."
          }
          actionLabel="Back to documentation"
          onAction={handleClearSelection}
        />
      }
    >
      <DocContent selection={selection} />
    </NotFoundBoundary>
  );

  if (isMobile) {
    const hasSelection = selection !== null || compareItems !== null || compareMode;
    const showSidebar = !hasSelection || sidebarOpen;

    return (
      <div className="flex flex-1 flex-col">
        {hasSelection && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen((prev) => !prev)}>
              <PanelLeft className="mr-1 h-4 w-4" />
              Browse
            </Button>
          </div>
        )}
        {showSidebar && <Suspense fallback={<LoadingSpinner />}>{sidebar}</Suspense>}
        {hasSelection && !sidebarOpen && <Suspense fallback={<LoadingSpinner />}>{content}</Suspense>}
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className="flex-1">
      <Panel defaultSize="25%" minSize="15%" maxSize="40%">
        <Suspense fallback={<LoadingSpinner />}>{sidebar}</Suspense>
      </Panel>
      <Separator className="w-1.5 bg-border transition-colors hover:bg-primary/50" />
      <Panel defaultSize="75%">
        <Suspense fallback={<LoadingSpinner />}>{content}</Suspense>
      </Panel>
    </Group>
  );
}

// ---------------------------------------------------------------------------
// DocContent
// ---------------------------------------------------------------------------

interface DocContentProps {
  selection: DocSelection | null;
}

function DocContent({ selection }: DocContentProps) {
  if (!selection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <BookOpen className="text-muted-foreground size-10" />
        <p className="text-muted-foreground text-sm">Select an item from the sidebar to view its documentation.</p>
      </div>
    );
  }

  switch (selection.category) {
    case "mcu-boards":
      return <DocBoardPage boardId={selection.itemId} />;
    case "printers":
      return <DocPrinterPage printerId={selection.itemId} />;
    case "stepper-drivers":
      return <DocStepperDriverPage driverId={selection.itemId} />;
    case "stepper-motors":
      return <DocStepperMotorPage motorId={selection.itemId} />;
    case "probes":
      return <DocProbePage probeId={selection.itemId} />;
    case "fans":
      return <DocFanPage fanId={selection.itemId} />;
    case "thermistors":
      return <DocThermistorPage thermistorId={selection.itemId} />;
    case "extruders":
      return <DocExtruderPage extruderId={selection.itemId} />;
    case "hotends":
      return <DocHotendPage hotendId={selection.itemId} />;
    case "power-supplies":
      return <DocPowerSupplyPage powerSupplyId={selection.itemId} />;
    case "accessories":
      return <DocAccessoryPage accessoryId={selection.itemId} />;
    case "filaments":
      return <DocFilamentPage filamentId={selection.itemId} />;
    case "displays":
      return <DocDisplayPage displayId={selection.itemId} />;
    case "toolheads":
      return <DocToolheadPage toolheadId={selection.itemId} />;
    case "mmus":
      return <DocMmuPage mmuId={selection.itemId} />;
    default:
      return null;
  }
}
