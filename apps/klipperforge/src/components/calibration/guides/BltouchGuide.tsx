import { GuideCode, GuideLayout, GuideStep, GuideText } from "../guide-shared";

export function BltouchGuide() {
  return (
    <GuideLayout
      title="BLTouch Calibration"
      subtitle="Set up and calibrate a BLTouch probe for automatic bed leveling."
    >
      <GuideStep step={1} title="Verify wiring">
        <GuideText>Test that the BLTouch responds to commands:</GuideText>
        <GuideCode>BLTOUCH_DEBUG COMMAND=pin_down</GuideCode>
        <GuideText>The probe pin should deploy. Then retract it:</GuideText>
        <GuideCode>BLTOUCH_DEBUG COMMAND=pin_up</GuideCode>
      </GuideStep>

      <GuideStep step={2} title="Calibrate Z offset">
        <GuideText>Home all axes, then start the calibration:</GuideText>
        <GuideCode>PROBE_CALIBRATE</GuideCode>
        <GuideText>
          Use the paper test — place a sheet of paper between the nozzle and bed, then lower the nozzle incrementally:
        </GuideText>
        <GuideCode>TESTZ Z=-0.1</GuideCode>
        <GuideText>When the nozzle lightly grips the paper, accept the position and save:</GuideText>
        <GuideCode>{"ACCEPT\nSAVE_CONFIG"}</GuideCode>
      </GuideStep>

      <GuideStep step={3} title="Create bed mesh">
        <GuideText>Generate a bed mesh to compensate for surface irregularities:</GuideText>
        <GuideCode>BED_MESH_CALIBRATE</GuideCode>
        <GuideText>
          Save the mesh with <code>SAVE_CONFIG</code> or include <code>BED_MESH_CALIBRATE</code> in your start g-code to
          generate a fresh mesh each print.
        </GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
