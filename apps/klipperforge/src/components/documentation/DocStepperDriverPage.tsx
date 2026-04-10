import { loadStepperDriver } from "@klipperforge/printer-data";
import { Ruler, Settings, Sparkles, Zap } from "lucide-react";
import { useDocDataQuery } from "@/hooks/use-queries";
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

export function DocStepperDriverPage({ driverId }: DocStepperDriverPageProps) {
  const driver = useDocDataQuery(loadStepperDriver, driverId);

  return (
    <DocPageShell>
      <DocHeader
        name={driver.name}
        manufacturer={driver.manufacturer}
        description={driver.description}
        badges={
          <div className="flex flex-col items-end gap-1">
            <Badge>{driver.driverInterface}</Badge>
            <Badge>[{driver.klipperSpecs.section}]</Badge>
          </div>
        }
      />

      <UnverifiedBanner unverified={driver.unverified} />

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

      <RelatedArticles articles={driver.relatedArticles} />
      <ReferenceList references={driver.references} />
    </DocPageShell>
  );
}
