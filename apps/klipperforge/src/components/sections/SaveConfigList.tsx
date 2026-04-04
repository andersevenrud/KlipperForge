import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useConfig } from "@/context/config-context";
import { useCollapsibleSections } from "@/hooks/use-collapsible-sections";
import { SAVE_CONFIG_HEADER_PREFIX } from "@klipperforge/klipper-config";
import { ChevronRight, LocateFixed } from "lucide-react";
import { useMemo } from "react";

export function SaveConfigList() {
  const { state } = useConfig();
  const filterScrollTarget = useMemo(() => (header: string) => header.startsWith(SAVE_CONFIG_HEADER_PREFIX), []);
  const { expandedSections, toggleSection, scrollToSection } = useCollapsibleSections({
    filterScrollTarget,
  });

  const sections = state.document.saveConfigSections;

  if (!sections || sections.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="mb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SAVE_CONFIG</p>
          <p className="text-[10px] text-muted-foreground">Auto-generated calibration data (read-only)</p>
        </div>
        {sections.map((section) => {
          const fullHeader = section.type === section.name ? section.type : `${section.type} ${section.name}`;
          const mapKey = `${SAVE_CONFIG_HEADER_PREFIX}${fullHeader}`;
          const isExpanded = expandedSections.has(mapKey);
          return (
            <Collapsible key={mapKey} open={isExpanded} onOpenChange={(open) => toggleSection(mapKey, open)}>
              <div
                data-section-header={mapKey}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
              >
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-1">
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                    <span className="truncate font-mono text-xs">[{fullHeader}]</span>
                  </button>
                </CollapsibleTrigger>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">read-only</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground md:h-6 md:w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToSection(mapKey);
                    }}
                  >
                    <LocateFixed className="h-3 w-3" />
                  </Button>
                </span>
              </div>
              <CollapsibleContent>
                <div className="ml-6 flex flex-col gap-1 py-1">
                  {Object.entries(section.values).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-muted-foreground">{key}</span>
                      <pre className="whitespace-pre-wrap break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                        {String(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      <Separator />
    </>
  );
}
