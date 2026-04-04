import {
  GuideCalculator,
  GuideLayout,
  GuideNotes,
  GuideSection,
  GuideStep,
  GuideSubStep,
  GuideText,
} from "../guide-shared";

export function FlowRateGuide() {
  return (
    <GuideLayout title="Flow Rate" subtitle="Fine-tune flow rate for optimal surface quality and dimensional accuracy.">
      <GuideSection title="Method 1: Orca Slicer">
        <GuideSubStep title="1. Run the flow test">
          <GuideText>
            Go to <strong>Calibration</strong> menu and select <strong>Flow Rate</strong> test.
          </GuideText>
        </GuideSubStep>

        <GuideSubStep title="2. Evaluate results">
          <GuideText>
            Orca prints two passes — a coarse and a fine test. Select the value with the smoothest top surface.
          </GuideText>
        </GuideSubStep>

        <GuideSubStep title="3. Calculate flow rate">
          <GuideCalculator
            title="Calculate Flow Rate"
            fields={[
              {
                type: "number",
                key: "flowRatio",
                label: "Flow Ratio",
                default: 1.0,
                step: 0.001,
                hint: "Current filament flow ratio",
              },
              {
                type: "number",
                key: "modifier",
                label: "Modifier",
                default: 0,
                step: 1,
                hint: "Number on the best-looking plate",
                measured: true,
              },
            ]}
            calculate={(v) => ((v.flowRatio as number) * (100 + (v.modifier as number))) / 100}
            decimalPlaces={5}
          />
        </GuideSubStep>
      </GuideSection>

      <GuideSection title="Method 2: Manual cube test">
        <GuideSubStep title="1. Print test cubes">
          <GuideText>
            Print 30×30×3mm cubes at different flow multiplier values (e.g., 0.92, 0.94, 0.96, 0.98, 1.00). Use 100%
            infill with a rectilinear pattern on top layers.
          </GuideText>
        </GuideSubStep>

        <GuideSubStep title="2. Inspect top surfaces">
          <GuideText>The ideal flow rate produces a top surface that is:</GuideText>
          <GuideNotes
            items={[
              "Smooth with no gaps between lines",
              "No ridges or over-extrusion bumps",
              "Flat when viewed from the side",
            ]}
          />
        </GuideSubStep>
      </GuideSection>

      <GuideStep step={3} title="Apply the result">
        <GuideText>
          Set the extrusion multiplier (flow rate) in your slicer's filament profile. This is per-filament, not a
          Klipper config value.
        </GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
