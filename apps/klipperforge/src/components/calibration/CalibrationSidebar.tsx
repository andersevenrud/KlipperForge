import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { GuideId, GuideInfo } from "./CalibrationView";

interface CalibrationSidebarProps {
  guides: GuideInfo[];
  selectedGuide: GuideId | null;
  onSelectGuide: (id: GuideId) => void;
}

interface GuideCategoryProps {
  title: string;
  guides: GuideInfo[];
  selectedGuide: GuideId | null;
  onSelectGuide: (id: GuideId) => void;
}

export function CalibrationSidebar({ guides, selectedGuide, onSelectGuide }: CalibrationSidebarProps) {
  const printGuides = guides.filter((g) => g.section === "print");
  const probeGuides = guides.filter((g) => g.section === "probe");
  const levelingGuides = guides.filter((g) => g.section === "leveling");

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-border bg-card">
      <div className="p-2">
        <GuideCategory
          title="Print Calibration"
          guides={printGuides}
          selectedGuide={selectedGuide}
          onSelectGuide={onSelectGuide}
        />
        <GuideCategory
          title="Probe Calibration"
          guides={probeGuides}
          selectedGuide={selectedGuide}
          onSelectGuide={onSelectGuide}
        />
        <GuideCategory
          title="Leveling"
          guides={levelingGuides}
          selectedGuide={selectedGuide}
          onSelectGuide={onSelectGuide}
        />
      </div>
    </div>
  );
}

function GuideCategory({ title, guides, selectedGuide, onSelectGuide }: GuideCategoryProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold hover:bg-accent">
        <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
        <span>{title}</span>
        <span className="text-muted-foreground ml-auto text-xs">{guides.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {guides.map((guide) => (
          <button
            key={guide.id}
            type="button"
            onClick={() => onSelectGuide(guide.id)}
            className={`w-full truncate rounded px-6 py-1 text-left text-sm hover:bg-accent ${
              selectedGuide === guide.id ? "bg-accent font-medium" : ""
            }`}
          >
            {guide.title}
          </button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
