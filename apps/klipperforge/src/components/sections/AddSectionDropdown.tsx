import { useEditorScroll } from "@klipperforge/editor";
import type { SectionInstance } from "@klipperforge/klipper-config";
import { defaultRegistry, SHARED_BUS_PIN_FIELDS } from "@klipperforge/klipper-config";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { resolveHeader, useConfig } from "@/context/config-context";
import { NamePromptDialog } from "./NamePromptDialog";
import { SectionHeader } from "./SectionHeader";
import { SectionList } from "./SectionList";
import { getCatalogByCategory, type SectionCatalogEntry } from "./section-catalog";

function collectExistingBusPins(sections: SectionInstance[]): Record<string, string> {
  const busPins: Record<string, string> = {};
  for (const section of sections) {
    if (section.disabled) continue;
    for (const [key, value] of Object.entries(section.data)) {
      if (SHARED_BUS_PIN_FIELDS.has(key) && typeof value === "string" && value !== "") {
        if (!busPins[key]) busPins[key] = value;
      }
    }
  }
  return busPins;
}

function mergeBusPins(instance: SectionInstance, defId: string, busPins: Record<string, string>): SectionInstance {
  const def = defaultRegistry.get(defId);
  if (!def?.params || Object.keys(busPins).length === 0) return instance;

  const merged = { ...instance.data };
  for (const [field, value] of Object.entries(busPins)) {
    if (field in def.params && (!merged[field] || merged[field] === "")) {
      merged[field] = value;
    }
  }
  return { ...instance, data: merged };
}

interface PendingNaming {
  prefix: string;
  separator: string;
  namePattern?: RegExp;
  namePatternMessage?: string;
}

function assignFileToActiveFile(
  instance: SectionInstance,
  state: { document: { files?: string[] }; activeFile: string },
): SectionInstance {
  const mainFile = state.document.files?.[0] ?? "printer.cfg";
  const isMultiFile = (state.document.files?.length ?? 1) > 1;
  if (isMultiFile && state.activeFile !== mainFile) {
    return { ...instance, file: state.activeFile };
  }
  return instance;
}

export function AddSectionDropdown() {
  const { state, dispatch } = useConfig();
  const { scrollToSection } = useEditorScroll();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<SectionCatalogEntry | null>(null);
  const [pendingNaming, setPendingNaming] = useState<PendingNaming | null>(null);
  const pendingScrollRef = useRef<string | null>(null);
  const [lastAddedHeader, setLastAddedHeader] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const existingHeaders = useMemo(() => new Set(state.document.sections.map(resolveHeader)), [state.document.sections]);

  const isSingularPresent = (defId: string): boolean => {
    const def = defaultRegistry.get(defId);
    if (!def) return false;
    if (def.naming.kind === "fixed" || def.naming.kind === "custom") {
      return existingHeaders.has(def.naming.header);
    }
    return false;
  };

  const handleAdd = (entry: SectionCatalogEntry) => {
    const def = defaultRegistry.get(entry.definitionId);
    if (!def) return;

    if (def.naming.kind === "named" || def.naming.kind === "suffixed") {
      setPendingEntry(entry);
      setPendingNaming({
        prefix: def.naming.prefix,
        separator: def.naming.kind === "named" ? " " : "_",
        namePattern: def.namePattern,
        namePatternMessage: def.namePatternMessage,
      });
      setDialogOpen(true);
      return;
    }

    const busPins = collectExistingBusPins(state.document.sections);
    const raw = defaultRegistry.createInstance(entry.definitionId, entry.defaults);
    let instance = mergeBusPins(raw, entry.definitionId, busPins);
    instance = assignFileToActiveFile(instance, state);
    const header = resolveHeader(instance);
    pendingScrollRef.current = header;
    setLastAddedHeader(header);
    dispatch({ type: "SET_SECTION", payload: instance });
  };

  const handleNameConfirm = (name: string) => {
    if (!pendingEntry) return;
    const busPins = collectExistingBusPins(state.document.sections);
    const raw = defaultRegistry.createInstance(pendingEntry.definitionId, pendingEntry.defaults, name);
    let instance = mergeBusPins(raw, pendingEntry.definitionId, busPins);
    instance = assignFileToActiveFile(instance, state);
    const header = resolveHeader(instance);
    pendingScrollRef.current = header;
    setLastAddedHeader(header);
    dispatch({ type: "SET_SECTION", payload: instance });
    setPendingEntry(null);
    setPendingNaming(null);
  };

  const catalogByCategory = useMemo(() => getCatalogByCategory(), []);

  const stepperNames = useMemo(
    () =>
      state.document.sections
        .filter((s) => s.definitionId === "stepper" || s.definitionId === "extruder")
        .map((s) => {
          if (s.definitionId === "stepper" && s.instanceName) return `stepper_${s.instanceName}`;
          if (s.definitionId === "extruder") return s.instanceName ?? "extruder";
          return null;
        })
        .filter((n): n is string => !!n),
    [state.document.sections],
  );

  const categories = Array.from(catalogByCategory.entries());

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const term = search.toLowerCase();
    return categories
      .map(([category, entries]) => [category, entries.filter((e) => e.label.toLowerCase().includes(term))] as const)
      .filter(([, entries]) => entries.length > 0);
  }, [categories, search]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally triggers on generatedOutput change to scroll after config re-renders
  useEffect(
    function scrollToPendingSectionEffect() {
      if (pendingScrollRef.current) {
        const header = pendingScrollRef.current;
        pendingScrollRef.current = null;
        requestAnimationFrame(() => {
          scrollToSection(header);
          const el = document.querySelector(`[data-section-header="${CSS.escape(header)}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
    },
    [state.generatedOutput, scrollToSection],
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader label="Sections">
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) setSearch("");
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-1">
              <Input
                placeholder="Search sections..."
                className="h-7 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.map(([category, entries], catIdx) => (
                <span key={category}>
                  {catIdx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {category}
                    </DropdownMenuLabel>
                    {entries.map((entry) => {
                      const disabled = isSingularPresent(entry.definitionId);
                      return (
                        <DropdownMenuItem
                          key={entry.definitionId}
                          disabled={disabled}
                          onSelect={() => handleAdd(entry)}
                        >
                          {entry.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </span>
              ))}
              {filteredCategories.length === 0 && (
                <p className="p-2 text-center text-xs text-muted-foreground">No sections found</p>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SectionHeader>

      <SectionList autoExpandHeader={lastAddedHeader} />

      {pendingEntry && pendingNaming && (
        <NamePromptDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sectionLabel={pendingEntry.label}
          existingHeaders={existingHeaders}
          prefix={pendingNaming.prefix}
          separator={pendingNaming.separator}
          onConfirm={handleNameConfirm}
          stepperNames={stepperNames}
          namePattern={pendingNaming.namePattern}
          namePatternMessage={pendingNaming.namePatternMessage}
        />
      )}
    </div>
  );
}
