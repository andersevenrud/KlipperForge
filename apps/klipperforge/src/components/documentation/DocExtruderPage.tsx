import { loadExtruder } from "@klipperforge/printer-data";
import { Ruler, Settings, Wrench } from "lucide-react";
import { useDocDataQuery, useDocIndicesQuery } from "@/hooks/use-queries";
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

const DRIVE_TYPE_LABELS: Record<string, string> = {
  direct: "Direct Drive",
  bowden: "Bowden",
  both: "Direct + Bowden",
};

interface DocExtruderPageProps {
  extruderId: string;
}

export function DocExtruderPage({ extruderId }: DocExtruderPageProps) {
  const extruder = useDocDataQuery(loadExtruder, extruderId);
  const { data: indices } = useDocIndicesQuery();

  const hasImage = indices.extruders.find((e) => e.id === extruderId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={extruder.name}
        manufacturer={extruder.manufacturer}
        description={extruder.description}
        badges={<Badge>{DRIVE_TYPE_LABELS[extruder.driveType] ?? extruder.driveType}</Badge>}
      />

      {hasImage && (
        <img
          src={`/data/extruders/images/${extruderId}.png`}
          alt={extruder.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      <UnverifiedBanner unverified={extruder.unverified} />

      <SpecSection title="Mechanical Specifications" icon={Wrench} unverified={extruder.unverified}>
        <SpecRow field="gearRatio" label="Gear Ratio" value={extruder.mechanicalSpecs.gearRatio} />
        <SpecRow
          field="filamentDiameter"
          label="Filament Diameter"
          value={extruder.mechanicalSpecs.filamentDiameter}
          suffix="mm"
        />
        <SpecRow field="gripType" label="Grip Type" value={extruder.mechanicalSpecs.gripType} />
        <SpecRow
          field="maxFeedRate"
          label="Max Feed Rate"
          value={extruder.mechanicalSpecs.maxFeedRate}
          suffix=" mm/s"
        />
      </SpecSection>

      <SpecSection title="Motor Specifications" icon={Settings} unverified={extruder.unverified}>
        {extruder.motorSpecs.includedMotor !== undefined && (
          <SpecRow
            field="includedMotor"
            label="Motor Included"
            value={extruder.motorSpecs.includedMotor ? "Yes" : "No"}
          />
        )}
        <SpecRow field="motorType" label="Motor Type" value={extruder.motorSpecs.motorType} />
        <SpecRow field="compatibleMotors" label="Compatible Motors" value={extruder.motorSpecs.compatibleMotors} />
      </SpecSection>

      {extruder.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={extruder.unverified}>
          <SpecRow field="weight" label="Weight" value={extruder.physicalSpecs.weight} suffix="g" />
          <SpecRow field="dimensions" label="Dimensions" value={extruder.physicalSpecs.dimensions} />
          <SpecRow field="mountPattern" label="Mount Pattern" value={extruder.physicalSpecs.mountPattern} />
        </SpecSection>
      )}

      <FeatureList features={extruder.features} />
      <RelatedArticles articles={extruder.relatedArticles} />
      <ReferenceList references={extruder.references} />
    </DocPageShell>
  );
}
