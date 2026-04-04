import { useDocDataQuery } from "@/hooks/use-queries";
import { loadStepperMotor } from "@klipperforge/printer-data";
import { Ruler, Thermometer, Zap } from "lucide-react";
import { Badge, DocHeader, DocPageShell, ReferenceList, SpecRow, SpecSection } from "./doc-shared";

interface DocStepperMotorPageProps {
  motorId: string;
}

export function DocStepperMotorPage({ motorId }: DocStepperMotorPageProps) {
  const motor = useDocDataQuery(loadStepperMotor, motorId);

  return (
    <DocPageShell>
      <DocHeader
        name={motor.name}
        manufacturer={motor.manufacturer}
        description={motor.description}
        badges={<Badge>NEMA{motor.nemaSize}</Badge>}
      />

      <SpecSection title="Electrical Specifications" icon={Zap}>
        <SpecRow label="Rated Current" value={motor.electricalSpecs.ratedCurrent} suffix="A per phase" />
        <SpecRow label="Holding Torque" value={motor.electricalSpecs.holdingTorque} suffix=" Ncm" />
        <SpecRow label="Step Angle" value={motor.electricalSpecs.stepAngle} suffix="°" />
        <SpecRow label="Phase Resistance" value={motor.electricalSpecs.phaseResistance} suffix=" Ω" />
        <SpecRow label="Phase Inductance" value={motor.electricalSpecs.phaseInductance} suffix=" mH" />
        <SpecRow label="Rated Voltage" value={motor.electricalSpecs.ratedVoltage} suffix="V" />
      </SpecSection>

      <SpecSection title="Physical Specifications" icon={Ruler}>
        <SpecRow label="Body Length" value={motor.physicalSpecs.bodyLength} suffix=" mm" />
        <SpecRow label="Weight" value={motor.physicalSpecs.weight} suffix="g" />
        <SpecRow label="Shaft Diameter" value={motor.physicalSpecs.shaftDiameter} suffix=" mm" />
        <SpecRow label="Shaft Length" value={motor.physicalSpecs.shaftLength} suffix=" mm" />
      </SpecSection>

      {(motor.connectorType || motor.temperatureRating !== undefined) && (
        <SpecSection title="Additional Details">
          <SpecRow icon={Zap} label="Connector" value={motor.connectorType} />
          <SpecRow icon={Thermometer} label="Temperature Rating" value={motor.temperatureRating} suffix="°C" />
        </SpecSection>
      )}

      <ReferenceList references={motor.references} />
    </DocPageShell>
  );
}
