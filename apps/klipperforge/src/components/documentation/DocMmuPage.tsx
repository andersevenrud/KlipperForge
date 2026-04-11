import { loadMmu } from "@klipperforge/printer-data";
import { Code, Cog, ExternalLink, Ruler, Spool } from "lucide-react";
import { useDocEntityQuery } from "@/hooks/use-queries";
import {
  Badge,
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

const MMU_TYPE_LABELS: Record<string, string> = {
  selector: "Selector",
  lane: "Lane-based",
};

interface DocMmuPageProps {
  mmuId: string;
}

export function DocMmuPage({ mmuId }: DocMmuPageProps) {
  const { entity: mmu, hasImage } = useDocEntityQuery(loadMmu, "mmus", mmuId);

  return (
    <DocPageShell>
      <DocHeader
        name={mmu.name}
        manufacturer={mmu.manufacturer}
        description={mmu.description}
        badges={
          <>
            <Badge>{MMU_TYPE_LABELS[mmu.mmuType] ?? mmu.mmuType}</Badge>
            {mmu.openSource ? <Badge>Open Source</Badge> : <Badge>Commercial</Badge>}
            {mmu.license && <Badge>{mmu.license}</Badge>}
          </>
        }
      />

      <DocHeroImage category="mmus" id={mmuId} name={mmu.name} hasImage={hasImage} />

      <UnverifiedBanner unverified={mmu.unverified} data={mmu} />

      <SpecSection title="Filament Specifications" icon={Spool} unverified={mmu.unverified}>
        <SpecRow field="filamentCapacity" label="Filament Capacity" value={mmu.filamentSpecs.filamentCapacity} />
        <SpecRow field="scalable" label="Scalable" value={mmu.filamentSpecs.scalable ? "Yes" : "No"} />
        {mmu.filamentSpecs.maxFilaments && (
          <SpecRow field="maxFilaments" label="Max Filaments" value={mmu.filamentSpecs.maxFilaments} />
        )}
        <SpecRow
          field="filamentDiameter"
          label="Filament Diameter"
          value={mmu.filamentSpecs.filamentDiameter}
          suffix="mm"
        />
      </SpecSection>

      <SpecSection title="Mechanical Specifications" icon={Cog} unverified={mmu.unverified}>
        <SpecRow field="driveType" label="Drive Type" value={mmu.mechanicalSpecs.driveType} />
        <SpecRow field="motorCount" label="Motor Count" value={mmu.mechanicalSpecs.motorCount} />
        <SpecRow
          field="bufferRequired"
          label="Buffer Required"
          value={mmu.mechanicalSpecs.bufferRequired ? "Yes" : "No"}
        />
        {mmu.mechanicalSpecs.bufferType && (
          <SpecRow field="bufferType" label="Buffer Type" value={mmu.mechanicalSpecs.bufferType} />
        )}
      </SpecSection>

      <SpecSection title="Software" icon={Code} unverified={mmu.unverified}>
        <SpecRow field="klipperDriver" label="Klipper Driver" value={mmu.softwareSpecs.klipperDriver} />
        {mmu.softwareSpecs.klipperDriverUrl && (
          <SpecRow field="klipperDriverUrl" label="Driver URL">
            <a
              href={mmu.softwareSpecs.klipperDriverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
            >
              {mmu.softwareSpecs.klipperDriverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              <ExternalLink className="size-3" />
            </a>
          </SpecRow>
        )}
      </SpecSection>

      {mmu.physicalSpecs && (
        <SpecSection title="Physical Specifications" icon={Ruler} unverified={mmu.unverified}>
          <SpecRow field="dimensions" label="Dimensions" value={mmu.physicalSpecs.dimensions} />
          <SpecRow field="weight" label="Weight" value={mmu.physicalSpecs.weight} suffix="g" />
          <SpecRow field="material" label="Material" value={mmu.physicalSpecs.material} />
          <SpecRow field="printable" label="Printable" value={mmu.physicalSpecs.printable ? "Yes" : "No"} />
        </SpecSection>
      )}

      <FeatureList features={mmu.features} />

      <RelatedArticles articles={mmu.relatedArticles} />
      <ReferenceList references={mmu.references} />
    </DocPageShell>
  );
}
