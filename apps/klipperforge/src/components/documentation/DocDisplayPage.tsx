import { loadDisplay } from "@klipperforge/printer-data";
import { Cable, Cpu, FileText, Monitor, Ruler } from "lucide-react";
import { useDocDataQuery, useDocIndicesQuery } from "@/hooks/use-queries";
import {
  Badge,
  BooleanSpecRow,
  DocHeader,
  DocPageShell,
  FeatureList,
  ReferenceList,
  RelatedArticles,
  SpecRow,
  SpecSection,
  UnverifiedBanner,
} from "./doc-shared";

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  "klipper-native": "Klipper Native",
  klipperscreen: "KlipperScreen",
  standalone: "Standalone",
  "all-in-one": "All-in-One",
  "dual-mode": "Dual Mode",
};

interface DocDisplayPageProps {
  displayId: string;
}

export function DocDisplayPage({ displayId }: DocDisplayPageProps) {
  const display = useDocDataQuery(loadDisplay, displayId);
  const { data: indices } = useDocIndicesQuery();
  const hasImage = indices.displays.find((d) => d.id === displayId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={display.name}
        manufacturer={display.manufacturer}
        description={display.description}
        badges={<Badge>{DISPLAY_TYPE_LABELS[display.displayType] ?? display.displayType}</Badge>}
      />

      {hasImage && (
        <img
          src={`/data/displays/images/${displayId}.png`}
          alt={display.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      <UnverifiedBanner unverified={display.unverified} />

      <SpecSection title="Screen Specifications" icon={Monitor} unverified={display.unverified}>
        <SpecRow field="size" label="Size" value={display.screenSpecs.size} />
        <SpecRow field="resolution" label="Resolution" value={display.screenSpecs.resolution} />
        <SpecRow field="panelType" label="Panel Type" value={display.screenSpecs.panelType} />
        <BooleanSpecRow field="touchscreen" label="Touchscreen" value={display.screenSpecs.touchscreen} />
        <SpecRow field="driver" label="Driver IC" value={display.screenSpecs.driver} />
      </SpecSection>

      <SpecSection title="Connection" icon={Cable} unverified={display.unverified}>
        <SpecRow field="interface" label="Interface" value={display.connectionSpecs.interface} />
        <SpecRow field="connector" label="Connector" value={display.connectionSpecs.connector} />
      </SpecSection>

      <SpecSection title="Klipper Integration" icon={FileText} unverified={display.unverified}>
        <SpecRow field="method" label="Method" value={display.klipperIntegration.method} />
        <SpecRow
          field="klipperDisplayType"
          label="Klipper Display Type"
          value={display.klipperIntegration.klipperDisplayType}
        />
        {display.klipperIntegration.requiresSbc !== undefined && (
          <BooleanSpecRow field="requiresSbc" label="Requires SBC" value={display.klipperIntegration.requiresSbc} />
        )}
        <SpecRow
          field="softwareRequired"
          label="Software Required"
          value={display.klipperIntegration.softwareRequired}
        />
      </SpecSection>

      {display.computeSpecs && (
        <SpecSection title="Compute" icon={Cpu} unverified={display.unverified}>
          <SpecRow field="processor" label="Processor" value={display.computeSpecs.processor} />
          <SpecRow field="ram" label="RAM" value={display.computeSpecs.ram} />
          {display.computeSpecs.wifi !== undefined && (
            <BooleanSpecRow field="wifi" label="WiFi" value={display.computeSpecs.wifi} />
          )}
          {display.computeSpecs.battery !== undefined && (
            <BooleanSpecRow field="battery" label="Battery" value={display.computeSpecs.battery} />
          )}
        </SpecSection>
      )}

      {display.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={display.unverified}>
          <SpecRow field="dimensions" label="Dimensions" value={display.physicalSpecs.dimensions} />
          <SpecRow field="weight" label="Weight" value={display.physicalSpecs.weight} suffix="g" />
          <SpecRow field="mountType" label="Mount Type" value={display.physicalSpecs.mountType} />
        </SpecSection>
      )}

      <FeatureList features={display.features} />

      <RelatedArticles articles={display.relatedArticles} />
      <ReferenceList references={display.references} />
    </DocPageShell>
  );
}
