import { GuideCalculator, GuideCode, GuideLayout, GuideStep, GuideText } from "../guide-shared";

export function ExtruderCalibrationGuide() {
  return (
    <GuideLayout
      title="Extruder Calibration"
      subtitle="Calibrate your extruder's rotation_distance so it extrudes the correct amount of filament."
    >
      <GuideStep step={1} title="Set max extrude distance">
        <GuideText>
          Temporarily add or update in your <code>[extruder]</code> section:
        </GuideText>
        <GuideCode>max_extrude_only_distance: 101</GuideCode>
      </GuideStep>

      <GuideStep step={2} title="Heat the hotend">
        <GuideText>Heat to your normal printing temperature for the loaded filament.</GuideText>
      </GuideStep>

      <GuideStep step={3} title="Mark the filament">
        <GuideText>Measure and mark the filament 120mm from the extruder body entrance.</GuideText>
      </GuideStep>

      <GuideStep step={4} title="Extrude 100mm">
        <GuideText>Set relative extrusion mode and extrude slowly:</GuideText>
        <GuideCode>{"M83\nG1 E100 F60"}</GuideCode>
      </GuideStep>

      <GuideStep step={5} title="Measure and calculate">
        <GuideText>
          Measure the distance from the mark to the extruder entrance, then calculate the new rotation distance:
        </GuideText>
        <GuideCalculator
          title="Calculate Rotation Distance"
          fields={[
            {
              type: "number",
              key: "prevRotationDistance",
              label: "Previous Rotation Distance",
              default: 33.5,
              step: 0.0001,
              hint: "Current rotation_distance value",
            },
            {
              type: "number",
              key: "measuredRemaining",
              label: "Measured Remaining",
              default: 20,
              step: 0.5,
              hint: "Distance from mark to extruder",
              measured: true,
            },
          ]}
          calculate={(v) => (v.prevRotationDistance as number) * ((120 - (v.measuredRemaining as number)) / 100)}
          decimalPlaces={6}
        />
      </GuideStep>

      <GuideStep step={6} title="Save and verify">
        <GuideText>
          Update <code>rotation_distance</code> in your <code>[extruder]</code> section, restart Klipper, and repeat the
          test to verify. The result should be within 0.5mm of 100mm.
        </GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
