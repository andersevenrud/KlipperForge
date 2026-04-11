import { loadStepperDriver } from "@klipperforge/printer-data";
import { Cpu, Puzzle, Ruler, Settings, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router";
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

interface DocStepperDriverPageProps {
  driverId: string;
}

const FORM_FACTOR_LABELS: Record<string, string> = {
  chip: "Chip",
  stepstick: "StepStick",
  ez: "EZ-Driver",
  external: "External",
  integrated: "Integrated",
};

export function DocStepperDriverPage({ driverId }: DocStepperDriverPageProps) {
  const driver = useDocDataQuery(loadStepperDriver, driverId);
  const { data: indices } = useDocIndicesQuery();

  const indexEntry = indices.stepperDrivers.find((d) => d.id === driverId);
  const hasImage = indexEntry?.hasImage;
  const baseChipEntry = driver.baseChip ? indices.stepperDrivers.find((d) => d.id === driver.baseChip) : undefined;
  const derivedModules =
    driver.formFactor === "chip" ? indices.stepperDrivers.filter((d) => d.baseChip === driverId) : [];

  return (
    <DocPageShell>
      <DocHeader
        name={driver.name}
        manufacturer={driver.manufacturer}
        description={driver.description}
        badges={
          <>
            <Badge>{driver.driverInterface}</Badge>
            <Badge>[{driver.klipperSpecs.section}]</Badge>
            {driver.formFactor && driver.formFactor !== "chip" && (
              <Badge>{FORM_FACTOR_LABELS[driver.formFactor] ?? driver.formFactor}</Badge>
            )}
          </>
        }
      />

      {hasImage && (
        <img
          src={`/data/stepper-drivers/images/${driverId}.png`}
          alt={driver.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

      {baseChipEntry && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Cpu className="text-muted-foreground size-4" />
          <span className="font-medium">Based on:</span>
          <Link
            to={`/documentation?driver=${baseChipEntry.id}`}
            className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
          >
            {baseChipEntry.name}
          </Link>
        </div>
      )}

      <UnverifiedBanner unverified={driver.unverified} data={driver} />

      <SpecSection title="Electrical" icon={Zap} unverified={driver.unverified}>
        {driver.electricalSpecs.supplyVoltageMin !== undefined &&
          driver.electricalSpecs.supplyVoltageMax !== undefined && (
            <SpecRow
              field="supplyVoltageMax"
              label="Supply Voltage (VM)"
              value={`${driver.electricalSpecs.supplyVoltageMin} – ${driver.electricalSpecs.supplyVoltageMax} V`}
            />
          )}
        <SpecRow
          field="rmsCurrentMax"
          label="Motor Current (RMS, max)"
          value={driver.electricalSpecs.rmsCurrentMax}
          suffix=" A"
        />
        <SpecRow
          field="peakCurrentMax"
          label="Motor Current (peak, max)"
          value={driver.electricalSpecs.peakCurrentMax}
          suffix=" A"
        />
        {driver.electricalSpecs.logicVoltageMin !== undefined &&
          driver.electricalSpecs.logicVoltageMax !== undefined && (
            <SpecRow
              field="logicVoltageMax"
              label="Logic Voltage (VIO)"
              value={`${driver.electricalSpecs.logicVoltageMin} – ${driver.electricalSpecs.logicVoltageMax} V`}
            />
          )}
        {typeof driver.electricalSpecs.senseResistor === "number" && (
          <SpecRow
            field="senseResistor"
            label="Sense Resistor (Rsense)"
            value={driver.electricalSpecs.senseResistor}
            suffix=" Ω"
          />
        )}
        {driver.electricalSpecs.senseResistor && typeof driver.electricalSpecs.senseResistor === "object" && (
          <SpecRow
            field="senseResistor"
            label="Sense Resistor (Rsense)"
            value={Object.entries(driver.electricalSpecs.senseResistor)
              .map(([rev, val]) => `${rev}: ${val} Ω`)
              .join(" · ")}
          />
        )}
        <SpecRow field="rref" label="Reference Resistor (Rref)" value={driver.electricalSpecs.rref} suffix=" Ω" />
      </SpecSection>

      <SpecSection title="Features" icon={Sparkles} unverified={driver.unverified}>
        <SpecRow field="microstepsMax" label="Native Microsteps" value={driver.featureSpecs.microstepsMax} />
        {driver.featureSpecs.interpolationTo256 !== undefined && (
          <BooleanSpecRow
            field="interpolationTo256"
            label="256× Interpolation (MicroPlyer)"
            value={driver.featureSpecs.interpolationTo256}
          />
        )}
        {driver.featureSpecs.stealthChop && driver.featureSpecs.stealthChop !== "none" && (
          <SpecRow field="stealthChop" label="StealthChop" value={driver.featureSpecs.stealthChop} />
        )}
        {driver.featureSpecs.spreadCycle !== undefined && (
          <BooleanSpecRow field="spreadCycle" label="SpreadCycle" value={driver.featureSpecs.spreadCycle} />
        )}
        {driver.featureSpecs.coolStep !== undefined && (
          <BooleanSpecRow field="coolStep" label="CoolStep" value={driver.featureSpecs.coolStep} />
        )}
        {driver.featureSpecs.stallGuard && driver.featureSpecs.stallGuard !== "none" && (
          <SpecRow field="stallGuard" label="StallGuard" value={driver.featureSpecs.stallGuard} />
        )}
        {driver.featureSpecs.dcStep !== undefined && (
          <BooleanSpecRow field="dcStep" label="dcStep" value={driver.featureSpecs.dcStep} />
        )}
        {driver.featureSpecs.sensorlessHoming !== undefined && (
          <BooleanSpecRow
            field="sensorlessHoming"
            label="Sensorless Homing"
            value={driver.featureSpecs.sensorlessHoming}
          />
        )}
      </SpecSection>

      <SpecSection title="Klipper Configuration" icon={Settings} unverified={driver.unverified}>
        <SpecRow field="klipperSection" label="Config Section">
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">[{driver.klipperSpecs.section}]</code>
        </SpecRow>
        <SpecRow field="klipperInterface" label="Interface" value={driver.klipperSpecs.driverInterface} />
        {driver.klipperSpecs.supportsDiagPin !== undefined && (
          <BooleanSpecRow
            field="supportsDiagPin"
            label="DIAG Pin Exposed"
            value={driver.klipperSpecs.supportsDiagPin}
          />
        )}
        {driver.klipperSpecs.supportsSensorlessHoming !== undefined && (
          <BooleanSpecRow
            field="supportsSensorlessHoming"
            label="Sensorless Homing in Klipper"
            value={driver.klipperSpecs.supportsSensorlessHoming}
          />
        )}
      </SpecSection>

      {driver.physicalSpecs && (
        <SpecSection title="Physical" icon={Ruler} unverified={driver.unverified}>
          <SpecRow field="packageType" label="Package" value={driver.physicalSpecs.packageType} />
          <SpecRow field="dimensions" label="Dimensions" value={driver.physicalSpecs.dimensions} />
          <SpecRow
            field="operatingTemperature"
            label="Operating Temperature"
            value={driver.physicalSpecs.operatingTemperature}
          />
        </SpecSection>
      )}

      {derivedModules.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Puzzle className="size-4" />
            Modules Based on This Chip
          </h2>
          <ul className="space-y-0.5">
            {derivedModules.map((module) => (
              <li key={module.id} className="text-sm">
                <Link
                  to={`/documentation?driver=${module.id}`}
                  className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                >
                  {module.name}
                </Link>
                <span className="text-muted-foreground ml-2 text-xs">({module.manufacturer})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RelatedArticles articles={driver.relatedArticles} />
      <ReferenceList references={driver.references} />
    </DocPageShell>
  );
}
