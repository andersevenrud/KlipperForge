import { loadProbe } from "@klipperforge/printer-data";
import { FileText, Ruler, Target, Zap } from "lucide-react";
import { useDocDataQuery, useDocIndicesQuery } from "@/hooks/use-queries";
import {
  Badge,
  BooleanSpecRow,
  DocHeader,
  DocPageShell,
  ReferenceList,
  RelatedArticles,
  SpecRow,
  SpecSection,
  UnverifiedBanner,
} from "./doc-shared";

const PROBE_TYPE_LABELS: Record<string, string> = {
  servo: "Servo",
  inductive: "Inductive",
  "eddy-current": "Eddy Current",
  mechanical: "Mechanical",
  "strain-gauge": "Strain Gauge",
};

interface DocProbePageProps {
  probeId: string;
}

export function DocProbePage({ probeId }: DocProbePageProps) {
  const probe = useDocDataQuery(loadProbe, probeId);
  const { data: indices } = useDocIndicesQuery();
  const hasImage = indices.probes.find((p) => p.id === probeId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={probe.name}
        manufacturer={probe.manufacturer}
        description={probe.description}
        badges={<Badge>{PROBE_TYPE_LABELS[probe.probeType] ?? probe.probeType}</Badge>}
      />

      {hasImage && (
        <img
          src={`/data/probes/images/${probeId}.png`}
          alt={probe.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      <UnverifiedBanner unverified={probe.unverified} data={probe} />

      <SpecSection title="Electrical Specifications" icon={Zap} unverified={probe.unverified}>
        <SpecRow field="operatingVoltage" label="Operating Voltage" value={probe.electricalSpecs.operatingVoltage} />
        <SpecRow field="signalType" label="Signal Type" value={probe.electricalSpecs.signalType} />
        <SpecRow field="currentDraw" label="Current Draw" value={probe.electricalSpecs.currentDraw} />
      </SpecSection>

      <SpecSection title="Performance Specifications" icon={Target} unverified={probe.unverified}>
        <SpecRow field="repeatability" label="Repeatability" value={probe.performanceSpecs.repeatability} />
        <SpecRow field="triggerDistance" label="Trigger Distance" value={probe.performanceSpecs.triggerDistance} />
        {probe.performanceSpecs.bedCompatibility && probe.performanceSpecs.bedCompatibility.length > 0 && (
          <div className="text-sm">
            <SpecRow
              field="bedCompatibility"
              label="Bed Compatibility"
              value={probe.performanceSpecs.bedCompatibility.join(", ")}
            />
            {probe.performanceSpecs.bedCompatibilityNote && (
              <p className="text-muted-foreground mt-1 ml-6 text-xs">{probe.performanceSpecs.bedCompatibilityNote}</p>
            )}
          </div>
        )}
        {probe.performanceSpecs.temperatureCompensation !== undefined && (
          <BooleanSpecRow
            field="temperatureCompensation"
            label="Temperature Compensation"
            value={probe.performanceSpecs.temperatureCompensation}
          />
        )}
        {probe.performanceSpecs.multiPoint !== undefined && (
          <BooleanSpecRow field="multiPoint" label="Mesh Leveling" value={probe.performanceSpecs.multiPoint} />
        )}
      </SpecSection>

      {probe.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={probe.unverified}>
          <SpecRow field="dimensions" label="Dimensions" value={probe.physicalSpecs.dimensions} />
          <SpecRow field="weight" label="Weight" value={probe.physicalSpecs.weight} suffix="g" />
          <SpecRow field="mountType" label="Mount Type" value={probe.physicalSpecs.mountType} />
        </SpecSection>
      )}

      {probe.klipperSection && (
        <SpecSection title="Klipper Configuration" icon={FileText}>
          <SpecRow label="Config Section" value={probe.klipperSection}>
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">[{probe.klipperSection}]</code>
          </SpecRow>
        </SpecSection>
      )}

      <RelatedArticles articles={probe.relatedArticles} />
      <ReferenceList references={probe.references} />
    </DocPageShell>
  );
}
