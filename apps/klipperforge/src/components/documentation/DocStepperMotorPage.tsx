import { loadStepperMotor } from "@klipperforge/printer-data";
import { Ruler, Thermometer, Zap } from "lucide-react";
import { useDocDataQuery, useDocIndicesQuery } from "@/hooks/use-queries";
import { Badge, DocHeader, DocPageShell, ReferenceList, RelatedArticles, SpecRow, SpecSection } from "./doc-shared";

interface DocStepperMotorPageProps {
  motorId: string;
}

export function DocStepperMotorPage({ motorId }: DocStepperMotorPageProps) {
  const motor = useDocDataQuery(loadStepperMotor, motorId);
  const { data: indices } = useDocIndicesQuery();

  const hasImage = indices.motors.find((m) => m.id === motorId)?.hasImage;

  return (
    <DocPageShell>
      <DocHeader
        name={motor.name}
        manufacturer={motor.manufacturer}
        description={motor.description}
        badges={<Badge>NEMA{motor.nemaSize}</Badge>}
      />

      {hasImage && (
        <img
          src={`/data/stepper-motors/images/${motorId}.png`}
          alt={motor.name}
          className="mt-4 max-h-64 rounded border object-contain"
        />
      )}

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

      <RelatedArticles articles={motor.relatedArticles} />
      <ReferenceList references={motor.references} />
    </DocPageShell>
  );
}
