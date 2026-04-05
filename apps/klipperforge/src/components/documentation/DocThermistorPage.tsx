import { useDocDataQuery } from "@/hooks/use-queries";
import { loadThermistor } from "@klipperforge/printer-data";
import { Ruler, Settings, Thermometer } from "lucide-react";
import {
  Badge,
  DocHeader,
  DocPageShell,
  ReferenceList,
  RelatedArticles,
  SpecRow,
  SpecSection,
  UnverifiedBanner,
} from "./doc-shared";

interface DocThermistorPageProps {
  thermistorId: string;
}

export function DocThermistorPage({ thermistorId }: DocThermistorPageProps) {
  const thermistor = useDocDataQuery(loadThermistor, thermistorId);

  return (
    <DocPageShell>
      <DocHeader
        name={thermistor.name}
        manufacturer={thermistor.manufacturer}
        description={thermistor.description}
        badges={<Badge>{thermistor.sensorType}</Badge>}
      />

      <UnverifiedBanner unverified={thermistor.unverified} />

      <SpecSection title="Sensing Specifications" icon={Thermometer} unverified={thermistor.unverified}>
        {thermistor.sensingSpecs.resistanceAt25C !== undefined && (
          <SpecRow
            field="resistanceAt25C"
            label="Resistance at 25°C"
            value={`${thermistor.sensingSpecs.resistanceAt25C.toLocaleString()}Ω`}
          />
        )}
        {thermistor.sensingSpecs.betaValue !== undefined && (
          <SpecRow field="betaValue" label="Beta Value (B25/50)" value={thermistor.sensingSpecs.betaValue} suffix="K" />
        )}
        <SpecRow field="temperatureRange" label="Temperature Range" value={thermistor.sensingSpecs.temperatureRange} />
        <SpecRow field="accuracy" label="Accuracy" value={thermistor.sensingSpecs.accuracy} />
        <SpecRow field="responseTime" label="Response Time" value={thermistor.sensingSpecs.responseTime} />
      </SpecSection>

      <SpecSection title="Klipper Configuration" icon={Settings} unverified={thermistor.unverified}>
        <SpecRow field="klipperSensorType" label="Sensor Type" value={thermistor.klipperSpecs.sensorType}>
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{thermistor.klipperSpecs.sensorType}</code>
        </SpecRow>
        {thermistor.klipperSpecs.requiresAmplifier && (
          <SpecRow
            field="requiresAmplifier"
            label="Requires Amplifier"
            value={`Yes${thermistor.klipperSpecs.amplifierChip ? ` (${thermistor.klipperSpecs.amplifierChip})` : ""}`}
          />
        )}
        {thermistor.klipperSpecs.pullupResistor !== undefined && (
          <SpecRow
            field="pullupResistor"
            label="Pullup Resistor"
            value={`${thermistor.klipperSpecs.pullupResistor.toLocaleString()}Ω`}
          />
        )}
      </SpecSection>

      {thermistor.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={thermistor.unverified}>
          <SpecRow field="packageType" label="Package Type" value={thermistor.physicalSpecs.packageType} />
          <SpecRow field="dimensions" label="Dimensions" value={thermistor.physicalSpecs.dimensions} />
          <SpecRow field="leadType" label="Lead Type" value={thermistor.physicalSpecs.leadType} />
        </SpecSection>
      )}

      <RelatedArticles articles={thermistor.relatedArticles} />
      <ReferenceList references={thermistor.references} />
    </DocPageShell>
  );
}
