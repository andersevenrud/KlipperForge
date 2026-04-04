import { GuideCode, GuideLayout, GuideNotes, GuideSection, GuideStep, GuideText } from "../guide-shared";

export function PidTuningGuide() {
  return (
    <GuideLayout title="PID Tuning" subtitle="Calibrate heater PID parameters for stable temperature control.">
      <GuideStep step={1} title="Tune extruder PID">
        <GuideText>
          Run the PID calibration command for your hotend. Adjust the TARGET to your typical printing temperature.
        </GuideText>
        <GuideCode>PID_CALIBRATE HEATER=extruder TARGET=210</GuideCode>
      </GuideStep>

      <GuideStep step={2} title="Tune bed PID">
        <GuideText>
          Run the PID calibration for the heated bed. Adjust TARGET to your typical bed temperature.
        </GuideText>
        <GuideCode>PID_CALIBRATE HEATER=heater_bed TARGET=60</GuideCode>
      </GuideStep>

      <GuideStep step={3} title="Save configuration">
        <GuideText>Save the tuned PID values to your config file.</GuideText>
        <GuideCode>SAVE_CONFIG</GuideCode>
      </GuideStep>

      <GuideSection title="Notes">
        <GuideNotes
          items={[
            "Set TARGET to the temperatures you actually print at for best results.",
            "The calibration will cycle the heater on and off several times — this is normal.",
            "SAVE_CONFIG will restart Klipper and write the results to your config file.",
          ]}
        />
      </GuideSection>
    </GuideLayout>
  );
}
