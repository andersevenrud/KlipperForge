import { PanelLeft, Wrench } from "lucide-react";
import { useCallback, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { CalibrationSidebar } from "./CalibrationSidebar";
import { BeaconGuide } from "./guides/BeaconGuide";
import { BedScrewPositionsGuide } from "./guides/BedScrewPositionsGuide";
import { BltouchGuide } from "./guides/BltouchGuide";
import { CartographerGuide } from "./guides/CartographerGuide";
import { ExtruderCalibrationGuide } from "./guides/ExtruderCalibrationGuide";
import { ExtrusionTemperatureGuide } from "./guides/ExtrusionTemperatureGuide";
import { FlowRateGuide } from "./guides/FlowRateGuide";
import { MaxVolumetricSpeedGuide } from "./guides/MaxVolumetricSpeedGuide";
import { PidTuningGuide } from "./guides/PidTuningGuide";
import { PressureAdvanceGuide } from "./guides/PressureAdvanceGuide";
import { RetractionGuide } from "./guides/RetractionGuide";

export type GuideId =
  | "pid-tuning"
  | "extrusion-temperature"
  | "extruder-calibration"
  | "pressure-advance"
  | "flow-rate"
  | "retraction"
  | "max-volumetric-speed"
  | "bltouch"
  | "cartographer"
  | "beacon"
  | "bed-screw-positions";

export interface GuideInfo {
  id: GuideId;
  title: string;
  section: "print" | "probe" | "leveling";
}

const GUIDES: GuideInfo[] = [
  { id: "pid-tuning", title: "PID Tuning", section: "print" },
  { id: "extrusion-temperature", title: "Extrusion Temperature", section: "print" },
  { id: "extruder-calibration", title: "Extruder Calibration", section: "print" },
  { id: "pressure-advance", title: "Pressure Advance", section: "print" },
  { id: "flow-rate", title: "Flow Rate", section: "print" },
  { id: "retraction", title: "Retraction", section: "print" },
  { id: "max-volumetric-speed", title: "Max Volumetric Speed", section: "print" },
  { id: "bltouch", title: "BLTouch", section: "probe" },
  { id: "cartographer", title: "Cartographer", section: "probe" },
  { id: "beacon", title: "Beacon", section: "probe" },
  { id: "bed-screw-positions", title: "Bed Screw Positions", section: "leveling" },
];

const GUIDE_IDS = new Set<string>(GUIDES.map((g) => g.id));

export function CalibrationView() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const guideParam = searchParams.get("guide");
  const selectedGuide: GuideId | null = guideParam && GUIDE_IDS.has(guideParam) ? (guideParam as GuideId) : null;

  const handleSelectGuide = useCallback(
    (id: GuideId) => {
      setSearchParams({ guide: id }, { replace: true });
      if (isMobile) setSidebarOpen(false);
    },
    [setSearchParams, isMobile],
  );

  const sidebar = (
    <CalibrationSidebar guides={GUIDES} selectedGuide={selectedGuide} onSelectGuide={handleSelectGuide} />
  );

  if (isMobile) {
    const showSidebar = !selectedGuide || sidebarOpen;

    return (
      <div className="flex flex-1 flex-col">
        {selectedGuide && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen((prev) => !prev)}>
              <PanelLeft className="mr-1 h-4 w-4" />
              Guides
            </Button>
          </div>
        )}
        {showSidebar && sidebar}
        {selectedGuide && !sidebarOpen && <CalibrationContent guideId={selectedGuide} />}
      </div>
    );
  }

  return (
    <Group orientation="horizontal" className="flex-1">
      <Panel defaultSize="25%" minSize="15%" maxSize="40%">
        {sidebar}
      </Panel>
      <Separator className="w-1.5 bg-border transition-colors hover:bg-primary/50" />
      <Panel defaultSize="75%">
        <CalibrationContent guideId={selectedGuide} />
      </Panel>
    </Group>
  );
}

interface CalibrationContentProps {
  guideId: GuideId | null;
}

function CalibrationContent({ guideId }: CalibrationContentProps) {
  if (!guideId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Wrench className="text-muted-foreground size-10" />
        <p className="text-muted-foreground text-sm">Select a guide from the sidebar to get started.</p>
      </div>
    );
  }

  return (
    <div key={guideId} className="h-full">
      {guideId === "pid-tuning" && <PidTuningGuide />}
      {guideId === "extrusion-temperature" && <ExtrusionTemperatureGuide />}
      {guideId === "extruder-calibration" && <ExtruderCalibrationGuide />}
      {guideId === "pressure-advance" && <PressureAdvanceGuide />}
      {guideId === "flow-rate" && <FlowRateGuide />}
      {guideId === "retraction" && <RetractionGuide />}
      {guideId === "max-volumetric-speed" && <MaxVolumetricSpeedGuide />}
      {guideId === "bltouch" && <BltouchGuide />}
      {guideId === "cartographer" && <CartographerGuide />}
      {guideId === "beacon" && <BeaconGuide />}
      {guideId === "bed-screw-positions" && <BedScrewPositionsGuide />}
    </div>
  );
}
