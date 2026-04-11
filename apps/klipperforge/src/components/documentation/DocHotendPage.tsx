import { loadHotend } from "@klipperforge/printer-data";
import { Flame, Ruler } from "lucide-react";
import { Link } from "react-router";
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

const HOTEND_TYPE_LABELS: Record<string, string> = {
  "all-metal": "All-Metal",
  "ptfe-lined": "PTFE-Lined",
};

interface DocHotendPageProps {
  hotendId: string;
}

export function DocHotendPage({ hotendId }: DocHotendPageProps) {
  const hotend = useDocDataQuery(loadHotend, hotendId);
  const { data: indices } = useDocIndicesQuery();

  const hasImage = indices.hotends.find((h) => h.id === hotendId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={hotend.name}
        manufacturer={hotend.manufacturer}
        description={hotend.description}
        badges={
          <>
            <Badge>{hotend.thermalSpecs.maxTemperature}°C</Badge>
            <Badge>{HOTEND_TYPE_LABELS[hotend.hotendType] ?? hotend.hotendType}</Badge>
          </>
        }
      />

      {hasImage && (
        <img
          src={`/data/hotends/images/${hotendId}.png`}
          alt={hotend.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      <UnverifiedBanner unverified={hotend.unverified} data={hotend} />

      <SpecSection title="Thermal Specifications" icon={Flame} unverified={hotend.unverified}>
        <SpecRow
          field="maxTemperature"
          label="Max Temperature"
          value={hotend.thermalSpecs.maxTemperature}
          suffix="°C"
        />
        <SpecRow field="heaterType" label="Heater Type" value={hotend.thermalSpecs.heaterType} />
        <SpecRow field="heaterPower" label="Heater Power" value={hotend.thermalSpecs.heaterPower} suffix="W" />
        <SpecRow field="heatUpTime" label="Heat-Up Time" value={hotend.thermalSpecs.heatUpTime} />
        <SpecRow field="thermistorType" label="Thermistor" value={hotend.thermalSpecs.thermistorType}>
          {hotend.thermalSpecs.thermistorId ? (
            <Link
              to={`/documentation?thermistor=${hotend.thermalSpecs.thermistorId}`}
              className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
            >
              {hotend.thermalSpecs.thermistorType}
            </Link>
          ) : undefined}
        </SpecRow>
      </SpecSection>

      <SpecSection title="Heat Break" icon={Flame} unverified={hotend.unverified}>
        <SpecRow field="heatBreakType" label="Type" value={hotend.heatBreakSpecs.type} />
        <SpecRow field="heatBreakMaterial" label="Material" value={hotend.heatBreakSpecs.material} />
        <SpecRow field="retraction" label="Retraction" value={hotend.heatBreakSpecs.retraction} />
      </SpecSection>

      <SpecSection title="Nozzle" icon={Flame} unverified={hotend.unverified}>
        <SpecRow field="nozzleSystem" label="Nozzle System" value={hotend.nozzleSpecs.system} />
        <SpecRow
          field="includedNozzleSizeMm"
          label="Included Nozzle"
          value={hotend.nozzleSpecs.includedNozzleSizeMm}
          suffix="mm"
        />
        {hotend.nozzleSpecs.compatibleNozzles && hotend.nozzleSpecs.compatibleNozzles.length > 0 && (
          <SpecRow
            field="compatibleNozzles"
            label="Compatible Nozzles"
            value={hotend.nozzleSpecs.compatibleNozzles.join(", ")}
          />
        )}
        <SpecRow field="maxFlowRate" label="Max Flow Rate" value={hotend.nozzleSpecs.maxFlowRate} />
      </SpecSection>

      {hotend.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={hotend.unverified}>
          <SpecRow
            field="filamentDiameter"
            label="Filament Diameter"
            value={hotend.physicalSpecs.filamentDiameter}
            suffix="mm"
          />
          <SpecRow field="weight" label="Weight" value={hotend.physicalSpecs.weight} suffix="g" />
          <SpecRow field="dimensions" label="Dimensions" value={hotend.physicalSpecs.dimensions} />
          <SpecRow field="mountType" label="Mount Type" value={hotend.physicalSpecs.mountType} />
        </SpecSection>
      )}

      <FeatureList features={hotend.features} />
      <RelatedArticles articles={hotend.relatedArticles} />
      <ReferenceList references={hotend.references} />
    </DocPageShell>
  );
}
