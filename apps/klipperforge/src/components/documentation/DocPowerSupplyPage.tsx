import { loadPowerSupply } from "@klipperforge/printer-data";
import { Ruler, Shield, Star, Thermometer, Zap } from "lucide-react";
import type { ReactNode } from "react";
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

const FORM_FACTOR_LABELS: Record<string, string> = {
  enclosed: "Enclosed",
  "enclosed-slim": "Enclosed (Slim)",
  "open-frame": "Open Frame",
};

interface RecommendationStyle {
  label: string;
  className: string;
}

const RECOMMENDATION_LABELS: Record<string, RecommendationStyle> = {
  "highly-recommended": {
    label: "Highly Recommended",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  recommended: { label: "Recommended", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  standard: { label: "Standard", className: "bg-muted text-muted-foreground" },
  budget: { label: "Budget", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

interface DocPowerSupplyPageProps {
  powerSupplyId: string;
}

export function DocPowerSupplyPage({ powerSupplyId }: DocPowerSupplyPageProps) {
  const psu = useDocDataQuery(loadPowerSupply, powerSupplyId);
  const { data: indices } = useDocIndicesQuery();

  const hasImage = indices.powerSupplies.find((p) => p.id === powerSupplyId)?.hasImage;
  const rec = RECOMMENDATION_LABELS[psu.communityRecommendation];

  const badges: ReactNode = (
    <>
      <Badge>{psu.voltage}V</Badge>
      <Badge>{psu.wattage}W</Badge>
      <Badge>{FORM_FACTOR_LABELS[psu.formFactor] ?? psu.formFactor}</Badge>
      {rec && (
        <span className={`mt-1 shrink-0 rounded px-2 py-0.5 text-xs font-medium ${rec.className}`}>{rec.label}</span>
      )}
    </>
  );

  return (
    <DocPageShell>
      <DocHeader name={psu.name} manufacturer={psu.manufacturer} description={psu.description} badges={badges} />

      {hasImage && (
        <img
          src={`/data/power-supplies/images/${powerSupplyId}.png`}
          alt={psu.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      <UnverifiedBanner unverified={psu.unverified} />

      <SpecSection title="Electrical Specifications" icon={Zap} unverified={psu.unverified}>
        <SpecRow field="outputVoltage" label="Output Voltage" value={psu.electricalSpecs.outputVoltage} suffix="V DC" />
        <SpecRow field="outputCurrent" label="Output Current" value={psu.electricalSpecs.outputCurrent} suffix="A" />
        <SpecRow field="outputPower" label="Output Power" value={psu.electricalSpecs.outputPower} suffix="W" />
        <SpecRow field="inputVoltageRange" label="Input Voltage" value={psu.electricalSpecs.inputVoltageRange} />
        <SpecRow field="efficiency" label="Efficiency" value={psu.electricalSpecs.efficiency} suffix="%" />
        <BooleanSpecRow
          field="powerFactorCorrection"
          label="Power Factor Correction"
          value={psu.electricalSpecs.powerFactorCorrection}
        />
      </SpecSection>

      <SpecSection title="Physical Specifications" icon={Ruler} unverified={psu.unverified}>
        <SpecRow field="dimensions" label="Dimensions" value={psu.physicalSpecs.dimensions} />
        <SpecRow field="weight" label="Weight" value={psu.physicalSpecs.weight} suffix="g" />
        <SpecRow
          field="coolingMethod"
          label="Cooling"
          value={`${psu.physicalSpecs.coolingMethod}${psu.physicalSpecs.hasFan ? " (with fan)" : " (fanless)"}`}
        />
        <SpecRow
          icon={Thermometer}
          field="operatingTemperature"
          label="Operating Temperature"
          value={psu.operatingTemperature}
        />
      </SpecSection>

      {psu.certifications.length > 0 && (
        <SpecSection title="Certifications">
          <div className="flex flex-wrap gap-2">
            {psu.certifications.map((cert) => (
              <div key={cert} className="flex items-center gap-1.5 text-sm">
                <Shield className="text-muted-foreground size-4" />
                <span>{cert}</span>
              </div>
            ))}
          </div>
        </SpecSection>
      )}

      {psu.protections.length > 0 && (
        <SpecSection title="Protections">
          <div className="flex flex-wrap gap-2">
            {psu.protections.map((protection) => (
              <code key={protection} className="bg-muted rounded px-2 py-0.5 text-xs">
                {protection}
              </code>
            ))}
          </div>
        </SpecSection>
      )}

      {psu.typicalUseCases.length > 0 && (
        <SpecSection title="Typical Use Cases">
          <ul className="space-y-1">
            {psu.typicalUseCases.map((useCase) => (
              <li key={useCase} className="flex items-center gap-2 text-sm">
                <Star className="text-muted-foreground size-3.5" />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </SpecSection>
      )}

      <RelatedArticles articles={psu.relatedArticles} />
      <ReferenceList references={psu.references} />
    </DocPageShell>
  );
}
