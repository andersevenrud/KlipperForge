import { GuideCode, GuideLayout, GuideStep, GuideText } from "../guide-shared";

export function BeaconGuide() {
  return (
    <GuideLayout title="Beacon Calibration" subtitle="Set up and calibrate a Beacon eddy current probe.">
      <GuideStep step={1} title="Initial calibration">
        <GuideText>Home X and Y, then move the probe to the center of the bed. Run the initial calibration:</GuideText>
        <GuideCode>BEACON_CALIBRATE</GuideCode>
        <GuideText>Follow the prompts to lower the nozzle to the bed using the paper test. Accept and save:</GuideText>
        <GuideCode>{"ACCEPT\nSAVE_CONFIG"}</GuideCode>
      </GuideStep>

      <GuideStep step={2} title="Touch calibration">
        <GuideText>For higher accuracy, heat the bed to printing temperature and run a touch calibration:</GuideText>
        <GuideCode>BEACON_AUTO_CALIBRATE</GuideCode>
        <GuideText>Save the result:</GuideText>
        <GuideCode>SAVE_CONFIG</GuideCode>
      </GuideStep>

      <GuideStep step={3} title="Bed mesh">
        <GuideText>Generate a bed mesh using Beacon's rapid scan:</GuideText>
        <GuideCode>BED_MESH_CALIBRATE</GuideCode>
        <GuideText>
          Save with <code>SAVE_CONFIG</code> or include in your start g-code for per-print mesh generation.
        </GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
