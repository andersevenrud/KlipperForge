import {
  GuideCalculator,
  GuideCode,
  GuideLayout,
  GuideNotes,
  GuideSection,
  GuideStep,
  GuideText,
} from "../guide-shared";

export function PressureAdvanceGuide() {
  return (
    <GuideLayout
      title="Pressure Advance"
      subtitle="Tune pressure advance to reduce oozing and improve corner sharpness."
    >
      <GuideStep step={1} title="Run the test">
        <GuideText>
          In Orca Slicer, go to <strong>Calibration</strong> menu and select <strong>Pressure Advance</strong> test.
        </GuideText>
      </GuideStep>

      <GuideStep step={2} title="Evaluate the print">
        <GuideText>Find the PA value that produces the sharpest corners with minimal bulging.</GuideText>
        <GuideCalculator
          title="Calculate Pressure Advance"
          fields={[
            {
              type: "number",
              key: "paStep",
              label: "PA Step",
              default: 0.002,
              step: 0.001,
              hint: "From slicer test settings",
            },
            {
              type: "number",
              key: "measuredHeight",
              label: "Measured Height",
              default: 0,
              step: 1,
              hint: "Measure from printed test",
              measured: true,
            },
          ]}
          calculate={(v) => (v.paStep as number) * (v.measuredHeight as number)}
          decimalPlaces={3}
        />
      </GuideStep>

      <GuideStep step={3} title="Apply the result">
        <GuideText>
          Set the value in your <code>[extruder]</code> section:
        </GuideText>
        <GuideCode>pressure_advance: 0.045</GuideCode>
      </GuideStep>

      <GuideSection title="Notes">
        <GuideNotes
          items={[
            "Retune pressure advance for each filament type (PLA, PETG, ABS, etc.).",
            "Typical values: direct drive 0.02–0.08, Bowden 0.3–1.0.",
          ]}
        />
      </GuideSection>
    </GuideLayout>
  );
}
