import { GuideLayout, GuideNotes, GuideStep, GuideText } from "../guide-shared";

export function ExtrusionTemperatureGuide() {
  return (
    <GuideLayout
      title="Extrusion Temperature"
      subtitle="Find the optimal printing temperature for your filament using a temperature tower."
    >
      <GuideStep step={1} title="Open Orca Slicer calibration">
        <GuideText>
          Go to <strong>Calibration</strong> menu and select <strong>Temperature Tower</strong>.
        </GuideText>
      </GuideStep>

      <GuideStep step={2} title="Configure the test">
        <GuideText>
          Set the filament type and temperature range. For PLA, a typical range is 190-230°C in 5°C increments.
        </GuideText>
      </GuideStep>

      <GuideStep step={3} title="Print and evaluate">
        <GuideText>Examine each section of the tower for:</GuideText>
        <GuideNotes
          items={[
            "Best layer adhesion (no delamination)",
            "Smooth surface quality",
            "Minimal stringing between features",
            "Clean bridging performance",
            "Accurate overhangs",
          ]}
        />
      </GuideStep>

      <GuideStep step={4} title="Apply the result">
        <GuideText>
          Set the temperature that produced the best overall result in your slicer filament profile.
        </GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
