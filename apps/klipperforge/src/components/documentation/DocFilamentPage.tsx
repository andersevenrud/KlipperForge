import { useDocDataQuery } from "@/hooks/use-queries";
import type { FilamentRatings } from "@klipperforge/printer-data";
import { loadFilament } from "@klipperforge/printer-data";
import { Droplets, FlaskConical, Gauge, Ruler, Thermometer } from "lucide-react";
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

interface DocFilamentPageProps {
  filamentId: string;
}

interface RatingBarProps {
  label: string;
  value: number;
}

const RATING_LABELS: Record<keyof FilamentRatings, string> = {
  strength: "Strength",
  stiffness: "Stiffness",
  durability: "Durability",
  printability: "Printability",
  heatResistance: "Heat Resistance",
};

const RATING_COLORS: Record<number, string> = {
  1: "bg-red-400",
  2: "bg-orange-400",
  3: "bg-yellow-400",
  4: "bg-lime-400",
  5: "bg-green-500",
};

function RatingBar({ label, value }: RatingBarProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 font-medium">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={`size-3 rounded-sm ${level <= value ? RATING_COLORS[value] : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

export function DocFilamentPage({ filamentId }: DocFilamentPageProps) {
  const filament = useDocDataQuery(loadFilament, filamentId);

  return (
    <DocPageShell>
      <DocHeader
        name={filament.name}
        manufacturer={filament.manufacturer}
        description={filament.description}
        badges={
          <>
            <Badge>{filament.filamentType}</Badge>
            <Badge>{filament.physicalSpecs.diameter} mm</Badge>
          </>
        }
      />

      <UnverifiedBanner unverified={filament.unverified} />

      {filament.ratings && (
        <div className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Gauge className="text-muted-foreground size-4" />
            Material Ratings
          </h2>
          <div className="space-y-2">
            {(Object.keys(RATING_LABELS) as (keyof FilamentRatings)[]).map((key) => (
              <RatingBar key={key} label={RATING_LABELS[key]} value={filament.ratings[key]} />
            ))}
          </div>
        </div>
      )}

      <SpecSection title="Print Settings" icon={Thermometer} unverified={filament.unverified}>
        <SpecRow field="nozzleTempRange" label="Nozzle Temperature" value={filament.printSpecs.nozzleTempRange} />
        <SpecRow field="bedTempRange" label="Bed Temperature" value={filament.printSpecs.bedTempRange} />
        <SpecRow field="firstLayerTemp" label="First Layer Temperature" value={filament.printSpecs.firstLayerTemp} />
        <SpecRow field="printSpeedRange" label="Print Speed" value={filament.printSpecs.printSpeedRange} />
        <SpecRow field="coolingFan" label="Cooling Fan" value={filament.printSpecs.coolingFan} />
        {filament.printSpecs.enclosureRequired !== undefined && (
          <BooleanSpecRow
            field="enclosureRequired"
            label="Enclosure Required"
            value={filament.printSpecs.enclosureRequired}
          />
        )}
      </SpecSection>

      {filament.mechanicalSpecs && (
        <SpecSection title="Mechanical Properties" icon={FlaskConical} unverified={filament.unverified}>
          <SpecRow
            field="tensileStrength"
            label="Tensile Strength"
            value={filament.mechanicalSpecs.tensileStrength}
            suffix=" MPa"
          />
          <SpecRow
            field="heatDeflectionTemp"
            label="Heat Deflection Temp"
            value={filament.mechanicalSpecs.heatDeflectionTemp}
            suffix="°C"
          />
          <SpecRow
            field="elongationAtBreak"
            label="Elongation at Break"
            value={filament.mechanicalSpecs.elongationAtBreak}
            suffix="%"
          />
          <SpecRow field="shoreHardness" label="Shore Hardness" value={filament.mechanicalSpecs.shoreHardness} />
          <SpecRow field="impactStrength" label="Impact Strength" value={filament.mechanicalSpecs.impactStrength} />
        </SpecSection>
      )}

      {filament.environmentalSpecs && (
        <SpecSection title="Environmental Properties" icon={Droplets} unverified={filament.unverified}>
          <SpecRow
            field="moistureSensitivity"
            label="Moisture Sensitivity"
            value={filament.environmentalSpecs.moistureSensitivity}
          />
          <SpecRow field="uvResistance" label="UV Resistance" value={filament.environmentalSpecs.uvResistance} />
          {filament.environmentalSpecs.foodSafe !== undefined && (
            <BooleanSpecRow field="foodSafe" label="Food Safe" value={filament.environmentalSpecs.foodSafe} />
          )}
          <SpecRow
            field="dryingTemp"
            label="Drying Temperature"
            value={filament.environmentalSpecs.dryingTemp}
            suffix="°C"
          />
          <SpecRow
            field="dryingTime"
            label="Drying Time"
            value={filament.environmentalSpecs.dryingTime}
            suffix=" hours"
          />
        </SpecSection>
      )}

      <SpecSection title="Physical Properties" icon={Ruler} unverified={filament.unverified}>
        <SpecRow field="diameter" label="Diameter" value={filament.physicalSpecs.diameter} suffix=" mm" />
        <SpecRow field="density" label="Density" value={filament.physicalSpecs.density} suffix=" g/cm³" />
        <SpecRow
          field="glassTransitionTemp"
          label="Glass Transition Temp"
          value={filament.physicalSpecs.glassTransitionTemp}
          suffix="°C"
        />
        <SpecRow field="meltingPoint" label="Melting Point" value={filament.physicalSpecs.meltingPoint} suffix="°C" />
      </SpecSection>

      <FeatureList features={filament.features} />

      <RelatedArticles articles={filament.relatedArticles} />
      <ReferenceList references={filament.references} />
    </DocPageShell>
  );
}
