import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocDataQuery, useDocIndicesQuery, useOptionalDocDataQuery } from "@/hooks/use-queries";
import { loadFan, loadPcbLayout } from "@klipperforge/printer-data";
import { Ruler, Volume2, Wind, Zap } from "lucide-react";
import { DocPcbViewer } from "./DocPcbViewer";
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

const FAN_TYPE_LABELS: Record<string, string> = {
  axial: "Axial",
  radial: "Radial / Blower",
  blower: "Blower",
  cpap: "CPAP",
};

interface DocFanPageProps {
  fanId: string;
}

export function DocFanPage({ fanId }: DocFanPageProps) {
  const fan = useDocDataQuery(loadFan, fanId);
  const { data: indices } = useDocIndicesQuery();
  const pcbLayout = useOptionalDocDataQuery(loadPcbLayout, fan.pcbLayoutId);

  const hasImage = indices.fans.find((f) => f.id === fanId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={fan.name}
        manufacturer={fan.manufacturer}
        description={fan.description}
        badges={
          <>
            <Badge>{fan.size}</Badge>
            <Badge>{FAN_TYPE_LABELS[fan.fanType] ?? fan.fanType}</Badge>
          </>
        }
      />

      {hasImage && !pcbLayout && (
        <img
          src={`/data/fans/images/${fanId}.png`}
          alt={fan.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}
      {pcbLayout && !hasImage && (
        <div className="mt-4">
          <DocPcbViewer layout={pcbLayout} label="Controller Board" />
        </div>
      )}
      {hasImage && pcbLayout && (
        <Tabs defaultValue="pcb" className="mt-4">
          <TabsList variant="line">
            <TabsTrigger value="photo">Product Photo</TabsTrigger>
            <TabsTrigger value="pcb">Controller Board</TabsTrigger>
          </TabsList>
          <TabsContent value="photo">
            <img
              src={`/data/fans/images/${fanId}.png`}
              alt={fan.name}
              className="max-h-64 rounded border object-contain"
            />
          </TabsContent>
          <TabsContent value="pcb">
            <DocPcbViewer layout={pcbLayout} label="Controller Board" />
          </TabsContent>
        </Tabs>
      )}

      <UnverifiedBanner unverified={fan.unverified} />

      <SpecSection title="Airflow Specifications" icon={Wind} unverified={fan.unverified}>
        <SpecRow field="airflow" label="Airflow" value={fan.airflowSpecs.airflow} suffix=" CFM" />
        <SpecRow
          field="staticPressure"
          label="Static Pressure"
          value={fan.airflowSpecs.staticPressure}
          suffix=" mmH₂O"
        />
        <SpecRow field="rpm" label="RPM" value={fan.airflowSpecs.rpm} />
        <SpecRow field="rpmRange" label="RPM Range" value={fan.airflowSpecs.rpmRange} />
      </SpecSection>

      <SpecSection title="Electrical Specifications" icon={Zap} unverified={fan.unverified}>
        <SpecRow field="voltage" label="Voltage" value={fan.electricalSpecs.voltage} suffix="V DC" />
        <SpecRow field="current" label="Current" value={fan.electricalSpecs.current} suffix="A" />
        <SpecRow field="power" label="Power" value={fan.electricalSpecs.power} suffix="W" />
        {fan.electricalSpecs.pwmCapable !== undefined && (
          <BooleanSpecRow field="pwmCapable" label="PWM Capable" value={fan.electricalSpecs.pwmCapable} />
        )}
        {fan.electricalSpecs.tachoSignal !== undefined && (
          <BooleanSpecRow field="tachoSignal" label="Tachometer Signal" value={fan.electricalSpecs.tachoSignal} />
        )}
      </SpecSection>

      {fan.noiseSpecs?.noiseLevel !== undefined && (
        <SpecSection title="Noise" icon={Volume2} unverified={fan.unverified}>
          <SpecRow field="noiseLevel" label="Noise Level" value={fan.noiseSpecs.noiseLevel} suffix=" dBA" />
        </SpecSection>
      )}

      <SpecSection title="Physical Specifications" icon={Ruler} unverified={fan.unverified}>
        <SpecRow field="dimensions" label="Dimensions" value={fan.physicalSpecs.dimensions} />
        <SpecRow field="weight" label="Weight" value={fan.physicalSpecs.weight} suffix="g" />
        <SpecRow field="bearingType" label="Bearing Type" value={fan.physicalSpecs.bearingType} />
        <SpecRow field="connectorType" label="Connector" value={fan.physicalSpecs.connectorType} />
        <SpecRow field="leadWireLength" label="Lead Wire Length" value={fan.physicalSpecs.leadWireLength} suffix="mm" />
      </SpecSection>

      <RelatedArticles articles={fan.relatedArticles} />
      <ReferenceList references={fan.references} />
    </DocPageShell>
  );
}
