import { GuideCalculator, GuideCode, GuideLayout, GuideStep, GuideText } from "../guide-shared";

export function RetractionGuide() {
  return (
    <GuideLayout title="Retraction" subtitle="Tune retraction settings to minimize stringing and oozing.">
      <GuideStep step={1} title="Tune pressure advance first">
        <GuideText>
          Pressure advance reduces the need for retraction. Calibrate it before tuning retraction for best results.
        </GuideText>
      </GuideStep>

      <GuideStep step={2} title="Run the retraction test">
        <GuideText>
          In Orca Slicer, go to <strong>Calibration</strong> menu and select <strong>Retraction test</strong>.
        </GuideText>
      </GuideStep>

      <GuideStep step={3} title="Starting values">
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1 text-left font-medium">Setup</th>
              <th className="py-1 text-left font-medium">Length</th>
              <th className="py-1 text-left font-medium">Speed</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-1">Direct drive</td>
              <td className="py-1">0.5 mm</td>
              <td className="py-1">35 mm/s</td>
            </tr>
            <tr>
              <td className="py-1">Bowden</td>
              <td className="py-1">1.0 mm</td>
              <td className="py-1">35 mm/s</td>
            </tr>
          </tbody>
        </table>
      </GuideStep>

      <GuideStep step={4} title="Evaluate the print">
        <GuideText>
          Look for the retraction length that eliminates stringing. Use the shortest distance that works — excessive
          retraction causes clogs.
        </GuideText>
        <GuideCalculator
          title="Calculate Retraction Length"
          fields={[
            {
              type: "number",
              key: "start",
              label: "Start Retraction Length",
              default: 0,
              step: 0.1,
              hint: "From slicer test settings",
            },
            { type: "number", key: "step", label: "Step", default: 0.1, step: 0.01, hint: "From slicer test settings" },
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
          decimalPlaces={5}
          unit="mm"
        />
      </GuideStep>

      <GuideStep step={5} title="Apply the result">
        <GuideText>
          Set in Klipper's <code>[firmware_retraction]</code> section:
        </GuideText>
        <GuideCode>{"[firmware_retraction]\nretract_length: 0.5\nretract_speed: 35"}</GuideCode>
        <GuideText>Or configure retraction length and speed directly in your slicer profile.</GuideText>
      </GuideStep>
    </GuideLayout>
  );
}
