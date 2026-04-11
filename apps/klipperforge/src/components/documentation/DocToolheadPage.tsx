import { loadToolhead } from "@klipperforge/printer-data";
import { Plug, Ruler } from "lucide-react";
import { useDocEntityQuery } from "@/hooks/use-queries";
import {
  Badge,
  BooleanSpecRow,
  DocHeader,
  DocHeroImage,
  DocPageShell,
  FeatureList,
  ReferenceList,
  RelatedArticles,
  SpecRow,
  SpecSection,
  UnverifiedBanner,
} from "./doc-shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLHEAD_TYPE_LABELS: Record<string, string> = {
  modular: "Modular",
  integrated: "Integrated",
  "tool-changer": "Tool Changer",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DocToolheadPageProps {
  toolheadId: string;
}

export function DocToolheadPage({ toolheadId }: DocToolheadPageProps) {
  const { entity: toolhead, hasImage } = useDocEntityQuery(loadToolhead, "toolheads", toolheadId);

  return (
    <DocPageShell>
      <DocHeader
        name={toolhead.name}
        manufacturer={toolhead.manufacturer}
        description={toolhead.description}
        badges={<Badge>{TOOLHEAD_TYPE_LABELS[toolhead.toolheadType] ?? toolhead.toolheadType}</Badge>}
      />

      <DocHeroImage category="toolheads" id={toolheadId} name={toolhead.name} hasImage={hasImage} />

      <UnverifiedBanner unverified={toolhead.unverified} data={toolhead} />

      <SpecSection title="Compatibility" icon={Plug} unverified={toolhead.unverified}>
        <SpecRow
          field="targetPrinters"
          label="Target Printers"
          value={toolhead.compatibilitySpecs.targetPrinters.join(", ")}
        />
        {toolhead.compatibilitySpecs.railSystems && toolhead.compatibilitySpecs.railSystems.length > 0 && (
          <SpecRow
            field="railSystems"
            label="Rail Systems"
            value={toolhead.compatibilitySpecs.railSystems.join(", ")}
          />
        )}
        {toolhead.compatibilitySpecs.hotendMounts && toolhead.compatibilitySpecs.hotendMounts.length > 0 && (
          <SpecRow
            field="hotendMounts"
            label="Hotend Mounts"
            value={toolhead.compatibilitySpecs.hotendMounts.join(", ")}
          />
        )}
        {toolhead.compatibilitySpecs.extruderMounts && toolhead.compatibilitySpecs.extruderMounts.length > 0 && (
          <SpecRow
            field="extruderMounts"
            label="Extruder Mounts"
            value={toolhead.compatibilitySpecs.extruderMounts.join(", ")}
          />
        )}
        {toolhead.compatibilitySpecs.probeMounts && toolhead.compatibilitySpecs.probeMounts.length > 0 && (
          <SpecRow
            field="probeMounts"
            label="Probe Mounts"
            value={toolhead.compatibilitySpecs.probeMounts.join(", ")}
          />
        )}
        {toolhead.compatibilitySpecs.fanMounts && toolhead.compatibilitySpecs.fanMounts.length > 0 && (
          <SpecRow field="fanMounts" label="Fan Mounts" value={toolhead.compatibilitySpecs.fanMounts.join(", ")} />
        )}
      </SpecSection>

      {toolhead.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={toolhead.unverified}>
          <SpecRow field="weight" label="Weight" value={toolhead.physicalSpecs.weight} suffix="g" />
          <SpecRow field="dimensions" label="Dimensions" value={toolhead.physicalSpecs.dimensions} />
          <SpecRow field="material" label="Material" value={toolhead.physicalSpecs.material} />
          {toolhead.physicalSpecs.printable !== undefined && (
            <BooleanSpecRow field="printable" label="Printable" value={toolhead.physicalSpecs.printable} />
          )}
        </SpecSection>
      )}

      <FeatureList features={toolhead.features} />
      <RelatedArticles articles={toolhead.relatedArticles} />
      <ReferenceList references={toolhead.references} />
    </DocPageShell>
  );
}
