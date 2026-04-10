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
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useDocIndicesQuery } from "@/hooks/use-queries";
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

function isSelected(selection: DocSelection | null, category: DocCategory, itemId: string): boolean {
  return selection?.category === category && selection.itemId === itemId;
}

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

  const filteredBoardGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const nonGeneric = indices.boards.filter((b) => b.vendor !== "Generic");
    const boards = query
      ? nonGeneric.filter((b) => b.name.toLowerCase().includes(query) || b.vendor.toLowerCase().includes(query))
      : nonGeneric;
    return groupBy(boards, (b) => b.vendor);
  }, [indices.boards, search]);

  const filteredPrinterGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const printers = query
      ? indices.printers.filter(
          (p) => p.name.toLowerCase().includes(query) || p.manufacturer.toLowerCase().includes(query),
        )
      : indices.printers;
    return groupBy(printers, (p) => p.manufacturer);
  }, [indices.printers, search]);

  const filteredMotorGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const motors = query
      ? indices.motors.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.manufacturer.toLowerCase().includes(query) ||
            `nema${m.nemaSize}`.includes(query),
        )
      : indices.motors;
    return groupBy(motors, (m) => m.manufacturer);
  }, [indices.motors, search]);

  const filteredStepperDriverGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const drivers = query
      ? indices.stepperDrivers.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.manufacturer.toLowerCase().includes(query) ||
            d.driverInterface.toLowerCase().includes(query) ||
            d.klipperSection.toLowerCase().includes(query),
        )
      : indices.stepperDrivers;
    return groupBy(drivers, (d) => d.manufacturer);
  }, [indices.stepperDrivers, search]);

  const filteredProbeGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const probes = query
      ? indices.probes.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.manufacturer.toLowerCase().includes(query) ||
            p.probeType.toLowerCase().includes(query),
        )
      : indices.probes;
    return groupBy(probes, (p) => p.manufacturer);
  }, [indices.probes, search]);

  const filteredFanGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const fans = query
      ? indices.fans.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.manufacturer.toLowerCase().includes(query) ||
            f.size.toLowerCase().includes(query) ||
            f.fanType.toLowerCase().includes(query),
        )
      : indices.fans;
    return groupBy(fans, (f) => f.manufacturer);
  }, [indices.fans, search]);

  const filteredThermistorGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const thermistors = query
      ? indices.thermistors.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.manufacturer.toLowerCase().includes(query) ||
            t.sensorType.toLowerCase().includes(query),
        )
      : indices.thermistors;
    return groupBy(thermistors, (t) => t.manufacturer);
  }, [indices.thermistors, search]);

  const filteredExtruderGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const extruders = query
      ? indices.extruders.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.manufacturer.toLowerCase().includes(query) ||
            e.driveType.toLowerCase().includes(query),
        )
      : indices.extruders;
    return groupBy(extruders, (e) => e.manufacturer);
  }, [indices.extruders, search]);

  const filteredHotendGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const hotends = query
      ? indices.hotends.filter(
          (h) =>
            h.name.toLowerCase().includes(query) ||
            h.manufacturer.toLowerCase().includes(query) ||
            h.hotendType.toLowerCase().includes(query),
        )
      : indices.hotends;
    return groupBy(hotends, (h) => h.manufacturer);
  }, [indices.hotends, search]);

  const filteredPowerSupplyGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const powerSupplies = query
      ? indices.powerSupplies.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.manufacturer.toLowerCase().includes(query) ||
            `${p.voltage}v`.includes(query) ||
            `${p.wattage}w`.includes(query),
        )
      : indices.powerSupplies;
    return groupBy(powerSupplies, (p) => p.manufacturer);
  }, [indices.powerSupplies, search]);

  const filteredAccessoryGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const accessories = query
      ? indices.accessories.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.manufacturer.toLowerCase().includes(query) ||
            a.accessoryType.toLowerCase().includes(query),
        )
      : indices.accessories;
    return groupBy(accessories, (a) => a.manufacturer);
  }, [indices.accessories, search]);

  const filteredDisplayGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const displays = query
      ? indices.displays.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.manufacturer.toLowerCase().includes(query) ||
            d.displayType.toLowerCase().includes(query),
        )
      : indices.displays;
    return groupBy(displays, (d) => d.manufacturer);
  }, [indices.displays, search]);

  const filteredFilamentGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filaments = query
      ? indices.filaments.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.manufacturer.toLowerCase().includes(query) ||
            f.filamentType.toLowerCase().includes(query),
        )
      : indices.filaments;
    return groupBy(filaments, (f) => f.manufacturer);
  }, [indices.filaments, search]);

  const filteredToolheadGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const toolheads = query
      ? indices.toolheads.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.manufacturer.toLowerCase().includes(query) ||
            t.toolheadType.toLowerCase().includes(query),
        )
      : indices.toolheads;
    return groupBy(toolheads, (t) => t.manufacturer);
  }, [indices.toolheads, search]);

  const filteredMmuGroups = useMemo(() => {
    const query = search.toLowerCase().trim();
    const mmus = query
      ? indices.mmus.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.manufacturer.toLowerCase().includes(query) ||
            m.mmuType.toLowerCase().includes(query),
        )
      : indices.mmus;
    return groupBy(mmus, (m) => m.manufacturer);
  }, [indices.mmus, search]);

  const forceOpen = search.trim() ? { open: true as const } : {};

  function categoryOpen(category: DocCategory) {
    if (forceOpen.open) return forceOpen;
    if (selection?.category === category) return { open: true as const };
    if (compareMode && compareCategory === category) return { open: true as const };
    return {};
  }

  function groupOpen(category: DocCategory, itemIds: string[]) {
    if (forceOpen.open) return forceOpen;
    if (selection?.category === category && itemIds.includes(selection.itemId)) {
      return { open: true as const };
    }
    if (compareMode && compareCategory === category && itemIds.some((id) => comparePendingIds.includes(id))) {
      return { open: true as const };
    }
    return {};
  }

  function isCategoryDimmed(category: DocCategory): boolean {
    return compareMode && compareCategory !== null && compareCategory !== category;
  }

  function handleItemClick(category: DocCategory, itemId: string) {
    if (compareMode) {
      if (category === "printers") return;
      if (compareCategory !== null && compareCategory !== category) return;
      onCompareItemToggle(category, itemId);
    } else {
      onSelect({ category, itemId });
    }
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
        <div className={isCategoryDimmed("mcu-boards") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("mcu-boards")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Cpu className="size-3.5" />
              <span>MCU Boards</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.boards.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredBoardGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "mcu-boards",
                    group.items.map((b) => b.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((board) => (
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
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredBoardGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No boards found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={compareMode ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("printers")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Printer className="size-3.5" />
              <span>Printers</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.printers.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredPrinterGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "printers",
                    group.items.map((p) => p.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((printer) => (
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
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredPrinterGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No printers found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("stepper-motors") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("stepper-motors")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Cog className="size-3.5" />
              <span>Stepper Motors</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.motors.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredMotorGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "stepper-motors",
                    group.items.map((m) => m.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((motor) => (
                      <SidebarItem
                        key={motor.id}
                        itemId={motor.id}
                        category="stepper-motors"
                        label={motor.name}
                        badge={`NEMA${motor.nemaSize}`}
                        suffix={"hasImage" in motor && motor.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "stepper-motors", motor.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(motor.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredMotorGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No motors found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("stepper-drivers") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("stepper-drivers")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Zap className="size-3.5" />
              <span>Stepper Drivers</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.stepperDrivers.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredStepperDriverGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "stepper-drivers",
                    group.items.map((d) => d.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((driver) => (
                      <SidebarItem
                        key={driver.id}
                        itemId={driver.id}
                        category="stepper-drivers"
                        label={driver.name}
                        badge={driver.driverInterface}
                        selected={isSelected(selection, "stepper-drivers", driver.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(driver.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredStepperDriverGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No drivers found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("probes") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("probes")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Crosshair className="size-3.5" />
              <span>Probes</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.probes.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredProbeGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "probes",
                    group.items.map((p) => p.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((probe) => (
                      <SidebarItem
                        key={probe.id}
                        itemId={probe.id}
                        category="probes"
                        label={probe.name}
                        badge={PROBE_TYPE_LABELS[probe.probeType] ?? probe.probeType}
                        suffix={"hasImage" in probe && probe.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "probes", probe.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(probe.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredProbeGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No probes found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("fans") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("fans")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Fan className="size-3.5" />
              <span>Fans</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.fans.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredFanGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "fans",
                    group.items.map((f) => f.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((fan) => (
                      <SidebarItem
                        key={fan.id}
                        itemId={fan.id}
                        category="fans"
                        label={fan.name}
                        badge={fan.size}
                        suffix={"hasImage" in fan && fan.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "fans", fan.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(fan.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredFanGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No fans found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("thermistors") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("thermistors")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Thermometer className="size-3.5" />
              <span>Thermistors</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.thermistors.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredThermistorGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "thermistors",
                    group.items.map((t) => t.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((thermistor) => (
                      <SidebarItem
                        key={thermistor.id}
                        itemId={thermistor.id}
                        category="thermistors"
                        label={thermistor.name}
                        badge={thermistor.sensorType}
                        suffix={"hasImage" in thermistor && thermistor.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "thermistors", thermistor.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(thermistor.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredThermistorGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No thermistors found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("extruders") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("extruders")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <CircleDot className="size-3.5" />
              <span>Extruders</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.extruders.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredExtruderGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "extruders",
                    group.items.map((e) => e.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((extruder) => (
                      <SidebarItem
                        key={extruder.id}
                        itemId={extruder.id}
                        category="extruders"
                        label={extruder.name}
                        badge={extruder.driveType}
                        suffix={"hasImage" in extruder && extruder.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "extruders", extruder.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(extruder.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredExtruderGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No extruders found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("hotends") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("hotends")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Flame className="size-3.5" />
              <span>Hotends</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.hotends.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredHotendGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "hotends",
                    group.items.map((h) => h.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((hotend) => (
                      <SidebarItem
                        key={hotend.id}
                        itemId={hotend.id}
                        category="hotends"
                        label={hotend.name}
                        badge={hotend.hotendType}
                        suffix={"hasImage" in hotend && hotend.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "hotends", hotend.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(hotend.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredHotendGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No hotends found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("toolheads") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("toolheads")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Combine className="size-3.5" />
              <span>Toolheads</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.toolheads.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredToolheadGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "toolheads",
                    group.items.map((t) => t.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((toolhead) => (
                      <SidebarItem
                        key={toolhead.id}
                        itemId={toolhead.id}
                        category="toolheads"
                        label={toolhead.name}
                        badge={TOOLHEAD_TYPE_LABELS[toolhead.toolheadType] ?? toolhead.toolheadType}
                        suffix={"hasImage" in toolhead && toolhead.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "toolheads", toolhead.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(toolhead.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredToolheadGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No toolheads found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("mmus") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("mmus")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <GitBranch className="size-3.5" />
              <span>MMUs</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.mmus.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredMmuGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "mmus",
                    group.items.map((m) => m.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((mmu) => (
                      <SidebarItem
                        key={mmu.id}
                        itemId={mmu.id}
                        category="mmus"
                        label={mmu.name}
                        badge={MMU_TYPE_LABELS[mmu.mmuType] ?? mmu.mmuType}
                        suffix={"hasImage" in mmu && mmu.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "mmus", mmu.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(mmu.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredMmuGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No MMUs found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("filaments") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("filaments")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Layers className="size-3.5" />
              <span>Filaments</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.filaments.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredFilamentGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "filaments",
                    group.items.map((f) => f.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((filament) => (
                      <SidebarItem
                        key={filament.id}
                        itemId={filament.id}
                        category="filaments"
                        label={filament.name}
                        badge={filament.filamentType}
                        suffix={"hasImage" in filament && filament.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "filaments", filament.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(filament.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredFilamentGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No filaments found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("power-supplies") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("power-supplies")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <PlugZap className="size-3.5" />
              <span>Power Supplies</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.powerSupplies.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredPowerSupplyGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "power-supplies",
                    group.items.map((p) => p.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((psu) => (
                      <SidebarItem
                        key={psu.id}
                        itemId={psu.id}
                        category="power-supplies"
                        label={psu.name}
                        badges={[`${psu.voltage}V`, `${psu.wattage}W`]}
                        suffix={"hasImage" in psu && psu.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "power-supplies", psu.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(psu.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredPowerSupplyGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No power supplies found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("accessories") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("accessories")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Puzzle className="size-3.5" />
              <span>Accessories</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.accessories.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredAccessoryGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "accessories",
                    group.items.map((a) => a.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((accessory) => (
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
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredAccessoryGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No accessories found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className={isCategoryDimmed("displays") ? "pointer-events-none opacity-40" : ""}>
          <Collapsible {...categoryOpen("displays")}>
            <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <Monitor className="size-3.5" />
              <span>Displays</span>
              <span className="text-muted-foreground ml-auto text-xs">{indices.displays.length}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {filteredDisplayGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  {...groupOpen(
                    "displays",
                    group.items.map((d) => d.id),
                  )}
                >
                  <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded px-4 py-1 text-sm font-medium hover:bg-accent">
                    <ChevronRight className="size-3 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group.key}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{group.items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {group.items.map((display) => (
                      <SidebarItem
                        key={display.id}
                        itemId={display.id}
                        category="displays"
                        label={display.name}
                        badge={DISPLAY_TYPE_LABELS[display.displayType] ?? display.displayType}
                        suffix={"hasImage" in display && display.hasImage ? IMAGE_INDICATOR : undefined}
                        selected={isSelected(selection, "displays", display.id)}
                        compareMode={compareMode}
                        compareChecked={comparePendingIds.includes(display.id)}
                        onClick={handleItemClick}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {filteredDisplayGroups.length === 0 && (
                <p className="text-muted-foreground p-4 text-center text-sm">No displays found.</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarItem — shared item button with optional checkbox
// ---------------------------------------------------------------------------

interface SidebarItemProps {
  itemId: string;
  category: DocCategory;
  label: string;
  badge?: string;
  badges?: string[];
  suffix?: React.ReactNode;
  selected: boolean;
  compareMode: boolean;
  compareChecked: boolean;
  onClick: (category: DocCategory, itemId: string) => void;
}

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
