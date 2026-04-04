import { GuideCalculator, GuideLayout, GuideNotes, GuideSection, GuideStep, GuideText } from "../guide-shared";

export function MaxVolumetricSpeedGuide() {
  return (
    <GuideLayout
      title="Max Volumetric Speed"
      subtitle="Find the maximum flow rate your hotend can sustain before extrusion quality degrades."
    >
      <GuideStep step={1} title="Run the test">
        <GuideText>
          In Orca Slicer, go to <strong>Calibration</strong> menu and select <strong>Max Volumetric Speed</strong> test.
        </GuideText>
      </GuideStep>

      <GuideStep step={2} title="Evaluate the print">
        <GuideText>
          Examine the print from bottom to top. Find the height where extrusion quality starts to degrade — look for
          under-extrusion, rough surfaces, or the extruder skipping steps.
        </GuideText>
        <GuideCalculator
          title="Calculate Max Volumetric Speed"
          fields={[
            { type: "number", key: "start", label: "Start", default: 5, step: 1, hint: "From slicer test settings" },
            { type: "number", key: "step", label: "Step", default: 0.5, step: 0.1, hint: "From slicer test settings" },
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
          calculate={(v) => (v.start as number) + (v.measuredHeight as number) * (v.step as number)}
          decimalPlaces={2}
          unit="mm³/s"
        />
      </GuideStep>

      <GuideStep step={3} title="Apply the result">
        <GuideText>
          Set the max volumetric speed in your slicer's filament profile. This limits flow rate regardless of print
          speed, preventing under-extrusion at high speeds.
        </GuideText>
      </GuideStep>

      <GuideSection title="Notes">
        <GuideNotes
          items={[
            "This value is per-filament — different materials have different max flow rates.",
            "Typical values: PLA 15–20, PETG 10–15, ABS 12–18 mm³/s (varies by hotend).",
            "High-flow hotends (e.g., Rapido, Dragon HF) can achieve 30+ mm³/s.",
          ]}
        />
      </GuideSection>
    </GuideLayout>
  );
}
