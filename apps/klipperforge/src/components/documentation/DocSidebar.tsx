import {
  ArrowLeftRight,
  ChevronRight,
  CircleDot,
  CircuitBoard,
  Cog,
  Combine,
  Cpu,
  Crosshair,
  Fan,
  Flame,
  GitBranch,
  Image,
  Layers,
  Monitor,
  PlugZap,
  Printer,
  Puzzle,
  Search,
  Thermometer,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useDocIndicesQuery } from "@/hooks/use-queries";
import { isComparableCategory } from "./comparison-specs";
import type { DocCategory, DocSelection } from "./DocumentationView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemGroup<T> {
  key: string;
  items: T[];
}

interface DocSidebarProps {
  selection: DocSelection | null;
  onSelect: (selection: DocSelection) => void;
  compareMode: boolean;
  compareCategory: DocCategory | null;
  comparePendingIds: string[];
  onCompareModeToggle: () => void;
  onCompareItemToggle: (category: DocCategory, itemId: string) => void;
}

interface CollapsibleState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategorySectionProps<T extends { id: string }> {
  icon: typeof Cpu;
  label: string;
  totalCount: number;
  groups: ItemGroup<T>[];
  emptyLabel: string;
  dimmed: boolean;
  searchActive: boolean;
  categoryOpenProps: CollapsibleState;
  groupOpenFn: (groupKey: string, itemIds: string[]) => CollapsibleState;
  renderItem: (item: T) => ReactNode;
}

interface SidebarItemProps {
  itemId: string;
  category: DocCategory;
  label: string;
  badge?: string;
  badges?: string[];
  suffix?: ReactNode;
  selected: boolean;
  compareMode: boolean;
  compareChecked: boolean;
  onClick: (category: DocCategory, itemId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupBy<T>(items: T[], keyFn: (item: T) => string): ItemGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => ({ key, items }));
}

function filterAndGroup<T>(
  items: T[],
  search: string,
  getSearchableStrings: (item: T) => (string | undefined)[],
  getGroupKey: (item: T) => string,
  preFilter?: (item: T) => boolean,
): ItemGroup<T>[] {
  const query = search.toLowerCase().trim();
  const base = preFilter ? items.filter(preFilter) : items;
  const filtered = query
    ? base.filter((item) => getSearchableStrings(item).some((value) => value?.toLowerCase().includes(query)))
    : base;
  return groupBy(filtered, getGroupKey);
}

function isSelected(selection: DocSelection | null, category: DocCategory, itemId: string): boolean {
  return selection?.category === category && selection.itemId === itemId;
}

function noop() {}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IMAGE_INDICATOR = (
  <span className="ml-auto shrink-0" title="Has product image">
    <Image className="size-3 text-muted-foreground" />
  </span>
);

const ACCESSORY_TYPE_LABELS: Record<string, string> = {
  "filament-buffer": "buffer",
  "filament-sensor": "sensor",
};

const PROBE_TYPE_LABELS: Record<string, string> = {
  servo: "servo",
  inductive: "inductive",
  "eddy-current": "eddy",
  mechanical: "mechanical",
  "strain-gauge": "strain",
};

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  "klipper-native": "native",
  klipperscreen: "KS",
  standalone: "WiFi",
  "all-in-one": "AIO",
  "dual-mode": "dual",
};

const TOOLHEAD_TYPE_LABELS: Record<string, string> = {
  modular: "modular",
  integrated: "integrated",
  "tool-changer": "changer",
};

const MMU_TYPE_LABELS: Record<string, string> = {
  selector: "selector",
  lane: "lane",
};

// ---------------------------------------------------------------------------
// CategorySection — generic collapsible category with grouped items
// ---------------------------------------------------------------------------

function CategorySection<T extends { id: string }>({
  icon: Icon,
  label,
  totalCount,
  groups,
  emptyLabel,
  dimmed,
  searchActive,
  categoryOpenProps,
  groupOpenFn,
  renderItem,
}: CategorySectionProps<T>) {
  if (searchActive && groups.length === 0) return null;

  return (
    <div className={dimmed ? "pointer-events-none opacity-40" : ""}>
      <Collapsible {...categoryOpenProps}>
        <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
          <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
          <Icon className="size-3.5" />
          <span>{label}</span>
          <span className="text-muted-foreground ml-auto text-xs">{totalCount}</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {groups.map((group) => (
            <Collapsible
              key={group.key}
              {...groupOpenFn(
                group.key,
                group.items.map((item) => item.id),
              )}
            >
              <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                <span>{group.key}</span>
                <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>{group.items.map(renderItem)}</CollapsibleContent>
            </Collapsible>
          ))}
          {groups.length === 0 && <p className="text-muted-foreground p-4 text-center text-sm">{emptyLabel}</p>}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarItem — shared item button with optional checkbox
// ---------------------------------------------------------------------------

function SidebarItem({
  itemId,
  category,
  label,
  badge,
  badges,
  suffix,
  selected,
  compareMode,
  compareChecked,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      data-item-id={itemId}
      type="button"
      className={`flex w-full items-center gap-1.5 truncate rounded px-8 py-1 text-left text-sm hover:bg-accent ${
        !compareMode && selected ? "bg-accent font-medium" : ""
      }`}
      onClick={() => onClick(category, itemId)}
    >
      {compareMode && <Checkbox checked={compareChecked} className="pointer-events-none shrink-0" tabIndex={-1} />}
      <span className="truncate">{label}</span>
      {badge && <code className="bg-muted shrink-0 rounded px-1 py-0.5 text-[10px]">{badge}</code>}
      {badges?.map((b) => (
        <code key={b} className="bg-muted shrink-0 rounded px-1 py-0.5 text-[10px]">
          {b}
        </code>
      ))}
      {suffix}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocSidebar({
  selection,
  onSelect,
  compareMode,
  compareCategory,
  comparePendingIds,
  onCompareModeToggle,
  onCompareItemToggle,
}: DocSidebarProps) {
  const { data: indices } = useDocIndicesQuery();
  const pcbBoardIds = useMemo(() => new Set(indices.pcbLayouts.map((l) => l.boardId)), [indices.pcbLayouts]);

  const [search, setSearch] = useState("");
  const [categoryOverrides, setCategoryOverrides] = useState<Partial<Record<DocCategory, boolean>>>({});
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(
    function scrollToSelectionEffect() {
      if (!selection || !scrollRef.current) return;
      const el = scrollRef.current.querySelector(`[data-item-id="${selection.itemId}"]`);
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    },
    [selection],
  );

  useEffect(
    function clearOverridesOnSelectionEffect() {
      if (!selection) return;
      setCategoryOverrides((prev) => {
        if (!(selection.category in prev)) return prev;
        const next = { ...prev };
        delete next[selection.category];
        return next;
      });
      setGroupOverrides((prev) => {
        const prefix = `${selection.category}__`;
        const next: Record<string, boolean> = {};
        let changed = false;
        for (const key of Object.keys(prev)) {
          if (key.startsWith(prefix)) {
            changed = true;
          } else {
            next[key] = prev[key];
          }
        }
        return changed ? next : prev;
      });
    },
    [selection],
  );

  const filtered = useMemo(
    () => ({
      boards: filterAndGroup(
        indices.boards,
        search,
        (b) => [b.name, b.vendor],
        (b) => b.vendor,
        (b) => b.vendor !== "Generic",
      ),
      printers: filterAndGroup(
        indices.printers,
        search,
        (p) => [p.name, p.manufacturer],
        (p) => p.manufacturer,
      ),
      motors: filterAndGroup(
        indices.motors,
        search,
        (m) => [m.name, m.manufacturer, `nema${m.nemaSize}`],
        (m) => m.manufacturer,
      ),
      stepperDrivers: filterAndGroup(
        indices.stepperDrivers,
        search,
        (d) => [d.name, d.manufacturer, d.driverInterface, d.klipperSection],
        (d) => d.manufacturer,
      ),
      probes: filterAndGroup(
        indices.probes,
        search,
        (p) => [p.name, p.manufacturer, p.probeType],
        (p) => p.manufacturer,
      ),
      fans: filterAndGroup(
        indices.fans,
        search,
        (f) => [f.name, f.manufacturer, f.size, f.fanType],
        (f) => f.manufacturer,
      ),
      thermistors: filterAndGroup(
        indices.thermistors,
        search,
        (t) => [t.name, t.manufacturer, t.sensorType],
        (t) => t.manufacturer,
      ),
      extruders: filterAndGroup(
        indices.extruders,
        search,
        (e) => [e.name, e.manufacturer, e.driveType],
        (e) => e.manufacturer,
      ),
      hotends: filterAndGroup(
        indices.hotends,
        search,
        (h) => [h.name, h.manufacturer, h.hotendType],
        (h) => h.manufacturer,
      ),
      powerSupplies: filterAndGroup(
        indices.powerSupplies,
        search,
        (p) => [p.name, p.manufacturer, `${p.voltage}v`, `${p.wattage}w`],
        (p) => p.manufacturer,
      ),
      accessories: filterAndGroup(
        indices.accessories,
        search,
        (a) => [a.name, a.manufacturer, a.accessoryType],
        (a) => a.manufacturer,
      ),
      displays: filterAndGroup(
        indices.displays,
        search,
        (d) => [d.name, d.manufacturer, d.displayType],
        (d) => d.manufacturer,
      ),
      filaments: filterAndGroup(
        indices.filaments,
        search,
        (f) => [f.name, f.manufacturer, f.filamentType],
        (f) => f.manufacturer,
      ),
      toolheads: filterAndGroup(
        indices.toolheads,
        search,
        (t) => [t.name, t.manufacturer, t.toolheadType],
        (t) => t.manufacturer,
      ),
      mmus: filterAndGroup(
        indices.mmus,
        search,
        (m) => [m.name, m.manufacturer, m.mmuType],
        (m) => m.manufacturer,
      ),
    }),
    [indices, search],
  );

  const searchActive = search.trim().length > 0;
  const noResults = searchActive && Object.values(filtered).every((g) => g.length === 0);

  function categoryOpen(category: DocCategory): CollapsibleState {
    if (searchActive) return { open: true as const, onOpenChange: noop };
    const override = categoryOverrides[category];
    const autoOpen = selection?.category === category || (compareMode && compareCategory === category);
    return {
      open: override ?? autoOpen,
      onOpenChange: (open: boolean) => {
        setCategoryOverrides((prev) => ({ ...prev, [category]: open }));
      },
    };
  }

  function groupOpen(category: DocCategory, groupKey: string, itemIds: string[]): CollapsibleState {
    if (searchActive) return { open: true as const, onOpenChange: noop };
    const stateKey = `${category}__${groupKey}`;
    const override = groupOverrides[stateKey];
    const autoOpen =
      (selection?.category === category && itemIds.includes(selection.itemId)) ||
      (compareMode && compareCategory === category && itemIds.some((id) => comparePendingIds.includes(id)));
    return {
      open: override ?? autoOpen,
      onOpenChange: (open: boolean) => {
        setGroupOverrides((prev) => ({ ...prev, [stateKey]: open }));
      },
    };
  }

  function isCategoryDimmed(category: DocCategory): boolean {
    if (!compareMode) return false;
    if (!isComparableCategory(category)) return true;
    return compareCategory !== null && compareCategory !== category;
  }

  function handleItemClick(category: DocCategory, itemId: string) {
    if (compareMode) {
      if (!isComparableCategory(category)) return;
      if (compareCategory !== null && compareCategory !== category) return;
      onCompareItemToggle(category, itemId);
    } else {
      onSelect({ category, itemId });
    }
  }

  function imageIndicator(item: { hasImage?: boolean }): ReactNode {
    return item.hasImage ? IMAGE_INDICATOR : undefined;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="icon"
            className="size-9 shrink-0"
            onClick={onCompareModeToggle}
            title={compareMode ? "Exit compare mode" : "Compare items"}
          >
            {compareMode ? <X className="size-4" /> : <ArrowLeftRight className="size-4" />}
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-1">
        <CategorySection
          icon={Cpu}
          label="MCU Boards"
          totalCount={indices.boards.length}
          groups={filtered.boards}
          emptyLabel="No boards found."
          dimmed={isCategoryDimmed("mcu-boards")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("mcu-boards")}
          groupOpenFn={(gk, ids) => groupOpen("mcu-boards", gk, ids)}
          renderItem={(board) => (
            <SidebarItem
              key={board.id}
              itemId={board.id}
              category="mcu-boards"
              label={board.name}
              suffix={
                pcbBoardIds.has(board.id) || board.hasImage ? (
                  <span className="ml-auto flex shrink-0 gap-1">
                    {pcbBoardIds.has(board.id) && (
                      <span title="Has interactive PCB layout">
                        <CircuitBoard className="size-3 text-muted-foreground" />
                      </span>
                    )}
                    {board.hasImage && (
                      <span title="Has product image">
                        <Image className="size-3 text-muted-foreground" />
                      </span>
                    )}
                  </span>
                ) : undefined
              }
              selected={isSelected(selection, "mcu-boards", board.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(board.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Printer}
          label="Printers"
          totalCount={indices.printers.length}
          groups={filtered.printers}
          emptyLabel="No printers found."
          dimmed={isCategoryDimmed("printers")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("printers")}
          groupOpenFn={(gk, ids) => groupOpen("printers", gk, ids)}
          renderItem={(printer) => (
            <button
              key={printer.id}
              data-item-id={printer.id}
              type="button"
              className={`w-full truncate rounded px-8 py-1 text-left text-sm hover:bg-accent ${
                isSelected(selection, "printers", printer.id) ? "bg-accent font-medium" : ""
              }`}
              onClick={() => onSelect({ category: "printers", itemId: printer.id })}
            >
              {printer.name}
            </button>
          )}
        />

        <CategorySection
          icon={Cog}
          label="Stepper Motors"
          totalCount={indices.motors.length}
          groups={filtered.motors}
          emptyLabel="No motors found."
          dimmed={isCategoryDimmed("stepper-motors")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("stepper-motors")}
          groupOpenFn={(gk, ids) => groupOpen("stepper-motors", gk, ids)}
          renderItem={(motor) => (
            <SidebarItem
              key={motor.id}
              itemId={motor.id}
              category="stepper-motors"
              label={motor.name}
              badge={`NEMA${motor.nemaSize}`}
              suffix={imageIndicator(motor)}
              selected={isSelected(selection, "stepper-motors", motor.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(motor.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Zap}
          label="Stepper Drivers"
          totalCount={indices.stepperDrivers.length}
          groups={filtered.stepperDrivers}
          emptyLabel="No drivers found."
          dimmed={isCategoryDimmed("stepper-drivers")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("stepper-drivers")}
          groupOpenFn={(gk, ids) => groupOpen("stepper-drivers", gk, ids)}
          renderItem={(driver) => (
            <SidebarItem
              key={driver.id}
              itemId={driver.id}
              category="stepper-drivers"
              label={driver.name}
              badge={driver.driverInterface}
              suffix={imageIndicator(driver)}
              selected={isSelected(selection, "stepper-drivers", driver.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(driver.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Crosshair}
          label="Probes"
          totalCount={indices.probes.length}
          groups={filtered.probes}
          emptyLabel="No probes found."
          dimmed={isCategoryDimmed("probes")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("probes")}
          groupOpenFn={(gk, ids) => groupOpen("probes", gk, ids)}
          renderItem={(probe) => (
            <SidebarItem
              key={probe.id}
              itemId={probe.id}
              category="probes"
              label={probe.name}
              badge={PROBE_TYPE_LABELS[probe.probeType] ?? probe.probeType}
              suffix={imageIndicator(probe)}
              selected={isSelected(selection, "probes", probe.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(probe.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Fan}
          label="Fans"
          totalCount={indices.fans.length}
          groups={filtered.fans}
          emptyLabel="No fans found."
          dimmed={isCategoryDimmed("fans")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("fans")}
          groupOpenFn={(gk, ids) => groupOpen("fans", gk, ids)}
          renderItem={(fan) => (
            <SidebarItem
              key={fan.id}
              itemId={fan.id}
              category="fans"
              label={fan.name}
              badge={fan.size}
              suffix={imageIndicator(fan)}
              selected={isSelected(selection, "fans", fan.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(fan.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Thermometer}
          label="Thermistors"
          totalCount={indices.thermistors.length}
          groups={filtered.thermistors}
          emptyLabel="No thermistors found."
          dimmed={isCategoryDimmed("thermistors")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("thermistors")}
          groupOpenFn={(gk, ids) => groupOpen("thermistors", gk, ids)}
          renderItem={(thermistor) => (
            <SidebarItem
              key={thermistor.id}
              itemId={thermistor.id}
              category="thermistors"
              label={thermistor.name}
              badge={thermistor.sensorType}
              suffix={imageIndicator(thermistor)}
              selected={isSelected(selection, "thermistors", thermistor.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(thermistor.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={CircleDot}
          label="Extruders"
          totalCount={indices.extruders.length}
          groups={filtered.extruders}
          emptyLabel="No extruders found."
          dimmed={isCategoryDimmed("extruders")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("extruders")}
          groupOpenFn={(gk, ids) => groupOpen("extruders", gk, ids)}
          renderItem={(extruder) => (
            <SidebarItem
              key={extruder.id}
              itemId={extruder.id}
              category="extruders"
              label={extruder.name}
              badge={extruder.driveType}
              suffix={imageIndicator(extruder)}
              selected={isSelected(selection, "extruders", extruder.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(extruder.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Flame}
          label="Hotends"
          totalCount={indices.hotends.length}
          groups={filtered.hotends}
          emptyLabel="No hotends found."
          dimmed={isCategoryDimmed("hotends")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("hotends")}
          groupOpenFn={(gk, ids) => groupOpen("hotends", gk, ids)}
          renderItem={(hotend) => (
            <SidebarItem
              key={hotend.id}
              itemId={hotend.id}
              category="hotends"
              label={hotend.name}
              badge={hotend.hotendType}
              suffix={imageIndicator(hotend)}
              selected={isSelected(selection, "hotends", hotend.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(hotend.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Combine}
          label="Toolheads"
          totalCount={indices.toolheads.length}
          groups={filtered.toolheads}
          emptyLabel="No toolheads found."
          dimmed={isCategoryDimmed("toolheads")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("toolheads")}
          groupOpenFn={(gk, ids) => groupOpen("toolheads", gk, ids)}
          renderItem={(toolhead) => (
            <SidebarItem
              key={toolhead.id}
              itemId={toolhead.id}
              category="toolheads"
              label={toolhead.name}
              badge={TOOLHEAD_TYPE_LABELS[toolhead.toolheadType] ?? toolhead.toolheadType}
              suffix={imageIndicator(toolhead)}
              selected={isSelected(selection, "toolheads", toolhead.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(toolhead.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={GitBranch}
          label="MMUs"
          totalCount={indices.mmus.length}
          groups={filtered.mmus}
          emptyLabel="No MMUs found."
          dimmed={isCategoryDimmed("mmus")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("mmus")}
          groupOpenFn={(gk, ids) => groupOpen("mmus", gk, ids)}
          renderItem={(mmu) => (
            <SidebarItem
              key={mmu.id}
              itemId={mmu.id}
              category="mmus"
              label={mmu.name}
              badge={MMU_TYPE_LABELS[mmu.mmuType] ?? mmu.mmuType}
              suffix={imageIndicator(mmu)}
              selected={isSelected(selection, "mmus", mmu.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(mmu.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Layers}
          label="Filaments"
          totalCount={indices.filaments.length}
          groups={filtered.filaments}
          emptyLabel="No filaments found."
          dimmed={isCategoryDimmed("filaments")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("filaments")}
          groupOpenFn={(gk, ids) => groupOpen("filaments", gk, ids)}
          renderItem={(filament) => (
            <SidebarItem
              key={filament.id}
              itemId={filament.id}
              category="filaments"
              label={filament.name}
              badge={filament.filamentType}
              suffix={imageIndicator(filament)}
              selected={isSelected(selection, "filaments", filament.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(filament.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={PlugZap}
          label="Power Supplies"
          totalCount={indices.powerSupplies.length}
          groups={filtered.powerSupplies}
          emptyLabel="No power supplies found."
          dimmed={isCategoryDimmed("power-supplies")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("power-supplies")}
          groupOpenFn={(gk, ids) => groupOpen("power-supplies", gk, ids)}
          renderItem={(psu) => (
            <SidebarItem
              key={psu.id}
              itemId={psu.id}
              category="power-supplies"
              label={psu.name}
              badges={[`${psu.voltage}V`, `${psu.wattage}W`]}
              suffix={imageIndicator(psu)}
              selected={isSelected(selection, "power-supplies", psu.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(psu.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Puzzle}
          label="Accessories"
          totalCount={indices.accessories.length}
          groups={filtered.accessories}
          emptyLabel="No accessories found."
          dimmed={isCategoryDimmed("accessories")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("accessories")}
          groupOpenFn={(gk, ids) => groupOpen("accessories", gk, ids)}
          renderItem={(accessory) => (
            <SidebarItem
              key={accessory.id}
              itemId={accessory.id}
              category="accessories"
              label={accessory.name}
              badge={ACCESSORY_TYPE_LABELS[accessory.accessoryType] ?? accessory.accessoryType}
              suffix={accessory.hasImage ? IMAGE_INDICATOR : undefined}
              selected={isSelected(selection, "accessories", accessory.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(accessory.id)}
              onClick={handleItemClick}
            />
          )}
        />

        <CategorySection
          icon={Monitor}
          label="Displays"
          totalCount={indices.displays.length}
          groups={filtered.displays}
          emptyLabel="No displays found."
          dimmed={isCategoryDimmed("displays")}
          searchActive={searchActive}
          categoryOpenProps={categoryOpen("displays")}
          groupOpenFn={(gk, ids) => groupOpen("displays", gk, ids)}
          renderItem={(display) => (
            <SidebarItem
              key={display.id}
              itemId={display.id}
              category="displays"
              label={display.name}
              badge={DISPLAY_TYPE_LABELS[display.displayType] ?? display.displayType}
              suffix={imageIndicator(display)}
              selected={isSelected(selection, "displays", display.id)}
              compareMode={compareMode}
              compareChecked={comparePendingIds.includes(display.id)}
              onClick={handleItemClick}
            />
          )}
        />

        {noResults && <p className="text-muted-foreground p-4 text-center text-sm">No results found.</p>}
      </div>
    </div>
  );
}
