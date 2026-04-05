import { useDocDataQuery } from "@/hooks/use-queries";
import { loadAccessory } from "@klipperforge/printer-data";
import { Ruler, Zap } from "lucide-react";
import {
  Badge,
  DocHeader,
  DocPageShell,
  FeatureList,
  ReferenceList,
  RelatedArticles,
  SpecRow,
  SpecSection,
  UnverifiedBanner,
} from "./doc-shared";

const ACCESSORY_TYPE_LABELS: Record<string, string> = {
  "filament-buffer": "Filament Buffer",
  "filament-sensor": "Filament Sensor",
};

interface DocAccessoryPageProps {
  accessoryId: string;
}

export function DocAccessoryPage({ accessoryId }: DocAccessoryPageProps) {
  const accessory = useDocDataQuery(loadAccessory, accessoryId);

  return (
    <DocPageShell>
      <DocHeader
        name={accessory.name}
        manufacturer={accessory.manufacturer}
        description={accessory.description}
        badges={
          <>
            <Badge>{ACCESSORY_TYPE_LABELS[accessory.accessoryType] ?? accessory.accessoryType}</Badge>
            {accessory.firmware?.map((fw) => (
              <Badge key={fw}>{fw}</Badge>
            ))}
          </>
        }
      />

      <UnverifiedBanner unverified={accessory.unverified} />

      {accessory.electricalSpecs && (
        <SpecSection title="Electrical Specifications" icon={Zap} unverified={accessory.unverified}>
          <SpecRow field="voltage" label="Voltage" value={accessory.electricalSpecs.voltage} />
          <SpecRow field="signalType" label="Signal Type" value={accessory.electricalSpecs.signalType} />
        </SpecSection>
      )}

      {accessory.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={accessory.unverified}>
          <SpecRow field="dimensions" label="Dimensions" value={accessory.physicalSpecs.dimensions} />
          <SpecRow field="weight" label="Weight" value={accessory.physicalSpecs.weight} suffix="g" />
          <SpecRow
            field="filamentDiameter"
            label="Filament Diameter"
            value={accessory.physicalSpecs.filamentDiameter}
            suffix="mm"
          />
        </SpecSection>
      )}

      <FeatureList features={accessory.features} />

      <RelatedArticles articles={accessory.relatedArticles} />
      <ReferenceList references={accessory.references} />
    </DocPageShell>
  );
}
