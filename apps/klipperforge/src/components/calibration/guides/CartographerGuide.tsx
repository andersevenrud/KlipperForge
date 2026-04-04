import { GuideCode, GuideFootnotes, GuideLayout, GuideNotes, GuideStep, GuideText } from "../guide-shared";

export function CartographerGuide() {
  return (
    <GuideLayout title="Cartographer Calibration" subtitle="Set up and calibrate a Cartographer eddy current probe.">
      <GuideStep step={1} title="Scan calibration">
        <GuideText>Home X and Y, then run the scan calibration:</GuideText>
        <GuideCode>{"G28 X Y\nCARTOGRAPHER_SCAN_CALIBRATE"}</GuideCode>
        <GuideText>
          The toolhead moves to the zero reference position. Use <code>TESTZ Z=-0.01</code> to gradually lower the
          nozzle until a piece of paper (or a 0.10mm feeler gauge for more precision) just catches between the nozzle
          and the bed. Visually confirm there is still a gap between the nozzle and the bed. If you are using Mainsail
          or Fluidd, the Z offset adjustment dialog appears automatically — use its buttons to step the nozzle down
          instead of typing TESTZ commands manually.
        </GuideText>
        <GuideText>
          Run <code>ACCEPT</code> (or click the accept button in the Mainsail/Fluidd dialog) to finish. The nozzle
          retracts and slowly descends while recording frequency response data — do not disturb the printer during this
          phase. Then save:
        </GuideText>
        <GuideCode>SAVE_CONFIG</GuideCode>
      </GuideStep>

      <GuideStep step={2} title="Touch calibration">
        <GuideText>Before starting, ensure:</GuideText>
        <GuideNotes
          items={[
            "Nozzle and bed are clean",
            "Probe height is between 2.6mm and 3mm above the nozzle",
            "Gantry and kinematics are rigid",
            "Bed is leveled (run QUAD_GANTRY_LEVEL or Z_TILT_ADJUST if available)",
          ]}
        />
        <GuideText>Home X and Y, then run the touch calibration:</GuideText>
        <GuideCode>{"G28 X Y\nCARTOGRAPHER_TOUCH_CALIBRATE"}</GuideCode>
        <GuideText>Keep your finger on the emergency stop button during this process. Once complete, save:</GuideText>
        <GuideCode>SAVE_CONFIG</GuideCode>
      </GuideStep>

      <GuideStep step={3} title="Bed mesh">
        <GuideText>Generate a bed mesh using the Cartographer's rapid scan mode:</GuideText>
        <GuideCode>BED_MESH_CALIBRATE</GuideCode>
        <GuideText>
          Save with <code>SAVE_CONFIG</code> or include in your start g-code for per-print mesh generation.
        </GuideText>
      </GuideStep>

      <GuideFootnotes
        items={[
          {
            label: "Cartographer Scan Calibration",
            url: "https://docs.cartographer3d.com/cartographer-probe/installation-and-setup/software-configuration/scan-calibration",
          },
          {
            label: "Cartographer Touch Calibration",
            url: "https://docs.cartographer3d.com/cartographer-probe/installation-and-setup/software-configuration/touch-calibration",
          },
        ]}
      />
    </GuideLayout>
  );
}
