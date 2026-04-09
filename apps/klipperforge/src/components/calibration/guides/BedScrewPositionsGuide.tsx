import { AlertTriangle, Info, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { BedScrewDiagram } from "../BedScrewDiagram";
import { GuideCode, GuideLayout, GuideSection, GuideText } from "../guide-shared";

interface ScrewEntry {
  id: string;
  x: number;
  y: number;
  name: string;
}

interface BedSize {
  width: number;
  height: number;
}

interface ProbeOffset {
  x: number;
  y: number;
}

const DEFAULT_BED: BedSize = { width: 235, height: 235 };
const DEFAULT_PROBE: ProbeOffset = { x: 0, y: 25 };

function defaultScrews(bed: BedSize): ScrewEntry[] {
  const inset = 32;
  return [
    { id: crypto.randomUUID(), x: inset, y: inset, name: "Front-left" },
    { id: crypto.randomUUID(), x: bed.width - inset, y: inset, name: "Front-right" },
    { id: crypto.randomUUID(), x: bed.width - inset, y: bed.height - inset, name: "Back-right" },
    { id: crypto.randomUUID(), x: inset, y: bed.height - inset, name: "Back-left" },
  ];
}

function parseUrlState(searchParams: URLSearchParams): {
  bed: BedSize;
  probe: ProbeOffset;
  screws: ScrewEntry[] | null;
} {
  const bed: BedSize = {
    width: Number(searchParams.get("bed_w")) || DEFAULT_BED.width,
    height: Number(searchParams.get("bed_h")) || DEFAULT_BED.height,
  };
  const probe: ProbeOffset = {
    x: Number(searchParams.get("probe_x")) || DEFAULT_PROBE.x,
    y: Number(searchParams.get("probe_y")) || DEFAULT_PROBE.y,
  };

  const screwsParam = searchParams.get("screws");
  let screws: ScrewEntry[] | null = null;
  if (screwsParam) {
    try {
      const parsed = JSON.parse(screwsParam) as { x: number; y: number; name: string }[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        screws = parsed.map((s) => ({
          id: crypto.randomUUID(),
          x: Number(s.x) || 0,
          y: Number(s.y) || 0,
          name: s.name || "",
        }));
      }
    } catch {
      // ignore invalid JSON
    }
  }

  return { bed, probe, screws };
}

function parseNum(raw: string): number {
  const n = Number.parseFloat(raw);
  return Number.isNaN(n) ? 0 : n;
}

export function BedScrewPositionsGuide() {
  const [searchParams] = useSearchParams();

  const [bedSize, setBedSize] = useState<BedSize>(() => {
    const { bed } = parseUrlState(searchParams);
    return bed;
  });

  const [probeOffset, setProbeOffset] = useState<ProbeOffset>(() => {
    const { probe } = parseUrlState(searchParams);
    return probe;
  });

  const [fromConfig] = useState(() => searchParams.has("screws"));

  const [screws, setScrews] = useState<ScrewEntry[]>(() => {
    const { bed, screws: urlScrews } = parseUrlState(searchParams);
    return urlScrews ?? defaultScrews(bed);
  });

  const handleAddScrew = useCallback(() => {
    setScrews((prev) => [...prev, { id: crypto.randomUUID(), x: 0, y: 0, name: `Screw ${prev.length + 1}` }]);
  }, []);

  const handleRemoveScrew = useCallback((id: string) => {
    setScrews((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleScrewChange = useCallback((id: string, field: keyof ScrewEntry, value: string) => {
    setScrews((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (field === "name") return { ...s, name: value };
        return { ...s, [field]: parseNum(value) };
      }),
    );
  }, []);

  const adjusted = screws.map((s) => ({
    ...s,
    adjX: s.x - probeOffset.x,
    adjY: s.y - probeOffset.y,
  }));

  const outOfBounds = adjusted.filter(
    (s) => s.adjX < 0 || s.adjY < 0 || s.adjX > bedSize.width || s.adjY > bedSize.height,
  );

  const configLines = adjusted.map(
    (s, i) => `screw${i + 1}: ${s.adjX}, ${s.adjY}${s.name ? `\nscrew${i + 1}_name: ${s.name}` : ""}`,
  );

  const configOutput = `[screws_tilt_adjust]\n${configLines.join("\n")}`;

  return (
    <GuideLayout
      title="Bed Screw Positions"
      subtitle="Calculate nozzle positions for [screws_tilt_adjust] from physical screw locations and probe offset."
    >
      <GuideText>
        Klipper&apos;s <code>[screws_tilt_adjust]</code> requires nozzle positions such that the probe ends up over each
        screw. This tool subtracts your probe&apos;s XY offset from each physical screw position to produce the correct
        config values.
      </GuideText>

      {fromConfig && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-blue-500/50 bg-blue-50 p-3 dark:bg-blue-950/20">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Screw positions were calculated from your config. Double-check that they match the physical screw locations
            on your bed.
          </p>
        </div>
      )}

      <GuideSection title="Bed Size">
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <FieldWrapper name="Width (mm)">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  value={bedSize.width}
                  onChange={(e) => setBedSize((prev) => ({ ...prev, width: parseNum(e.target.value) }))}
                />
              )}
            </FieldWrapper>
          </div>
          <div className="space-y-1">
            <FieldWrapper name="Height (mm)">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  value={bedSize.height}
                  onChange={(e) => setBedSize((prev) => ({ ...prev, height: parseNum(e.target.value) }))}
                />
              )}
            </FieldWrapper>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Probe Offset">
        <GuideText>
          The XY distance from the nozzle to the probe. Found in your <code>[probe]</code>, <code>[bltouch]</code>, or
          similar section.
        </GuideText>
        <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <FieldWrapper name="x_offset">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="0.1"
                  value={probeOffset.x}
                  onChange={(e) => setProbeOffset((prev) => ({ ...prev, x: parseNum(e.target.value) }))}
                />
              )}
            </FieldWrapper>
          </div>
          <div className="space-y-1">
            <FieldWrapper name="y_offset">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  step="0.1"
                  value={probeOffset.y}
                  onChange={(e) => setProbeOffset((prev) => ({ ...prev, y: parseNum(e.target.value) }))}
                />
              )}
            </FieldWrapper>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Screw Positions">
        <GuideText>Physical screw positions on the bed (measured from origin).</GuideText>
        <div className="mt-2 flex flex-col gap-2">
          {screws.map((screw, i) => (
            <div key={screw.id} className="flex items-end gap-2">
              <div className="space-y-1">
                <FieldWrapper name="Name">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={screw.name}
                      onChange={(e) => handleScrewChange(screw.id, "name", e.target.value)}
                      className="w-32"
                    />
                  )}
                </FieldWrapper>
              </div>
              <div className="space-y-1">
                <FieldWrapper name="X">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      value={screw.x}
                      onChange={(e) => handleScrewChange(screw.id, "x", e.target.value)}
                      className="w-24"
                    />
                  )}
                </FieldWrapper>
              </div>
              <div className="space-y-1">
                <FieldWrapper name="Y">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      value={screw.y}
                      onChange={(e) => handleScrewChange(screw.id, "y", e.target.value)}
                      className="w-24"
                    />
                  )}
                </FieldWrapper>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveScrew(screw.id)}
                disabled={screws.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <span className="pb-2 text-xs text-muted-foreground">
                &rarr; {adjusted[i].adjX}, {adjusted[i].adjY}
              </span>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={handleAddScrew}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add screw
          </Button>
        </div>
      </GuideSection>

      <BedScrewDiagram bedWidth={bedSize.width} bedHeight={bedSize.height} screws={screws} probeOffset={probeOffset} />

      <GuideSection title="Generated Config">
        <GuideCode>{configOutput}</GuideCode>
      </GuideSection>

      {outOfBounds.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-50 p-3 dark:bg-yellow-950/20">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Out of bounds</p>
            <p className="text-yellow-700 dark:text-yellow-400">
              {outOfBounds.map((s) => s.name || "Unnamed").join(", ")} — adjusted position falls outside the bed area.
              The nozzle cannot reach this position.
            </p>
          </div>
        </div>
      )}
    </GuideLayout>
  );
}
