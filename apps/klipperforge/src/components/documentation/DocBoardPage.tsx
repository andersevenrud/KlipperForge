import type { JumperOption, PcbConnector, PcbLayout } from "@klipperforge/printer-data";
import { loadMcuBoard, loadPcbLayout } from "@klipperforge/printer-data";
import { Cog, Cpu, Ruler, Zap } from "lucide-react";
import { useMemo } from "react";
import { DipSwitchDiagram } from "@/components/svg/pcb/DipSwitchDiagram";
import { JumperPinDiagram } from "@/components/svg/pcb/JumperPinDiagram";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMcu } from "@/context/mcu-context";
import { useDocDataQuery, useOptionalDocDataQuery } from "@/hooks/use-queries";
import { DocPcbViewer } from "./DocPcbViewer";
import { DocPageShell, ReferenceList, RelatedArticles, SpecRow } from "./doc-shared";

interface DocBoardPageProps {
  boardId: string;
}

interface JumperGroup {
  name: string;
  connectorNames: string[];
  connector: PcbConnector;
  options: JumperOption[];
  isDipSwitch: boolean;
}

function buildJumperGroups(pcbLayout: PcbLayout): JumperGroup[] {
  const { connectors, jumperConfigs } = pcbLayout;
  if (!jumperConfigs) return [];

  const jumperConnectors = connectors.filter(
    (c) => (c.category === "jumper" || c.category === "dip-switch") && jumperConfigs[c.name],
  );
  if (jumperConnectors.length === 0) return [];

  const grouped = new Map<string, { connectors: PcbConnector[]; options: JumperOption[] }>();
  for (const conn of jumperConnectors) {
    const options = jumperConfigs[conn.name];
    const configKey = JSON.stringify(options);
    const titleGroup = conn.title ? conn.title.replace(/^[A-Z]+\d+\s+/, "") : "";
    const key = titleGroup ? `${configKey}|${titleGroup}` : configKey;
    const existing = grouped.get(key);
    if (existing) {
      existing.connectors.push(conn);
    } else {
      grouped.set(key, { connectors: [conn], options });
    }
  }

  return Array.from(grouped.values()).map(({ connectors: conns, options }) => {
    const names = conns.map((c) => c.name);
    const name = deriveGroupNameFromConnectors(conns);
    return {
      name,
      connectorNames: names,
      connector: conns[0],
      options,
      isDipSwitch: conns[0].category === "dip-switch",
    };
  });
}

function deriveGroupNameFromConnectors(connectors: PcbConnector[]): string {
  const titles = connectors.map((c) => c.title).filter((t): t is string => t != null);
  if (titles.length > 0) {
    // Strip channel prefix (e.g., "MOTOR0 " from "MOTOR0 Voltage Select") to get the shared group name
    const stripped = titles.map((t) => t.replace(/^[A-Z]+\d+\s+/, ""));
    const unique = [...new Set(stripped)];
    if (unique.length === 1) return unique[0];
  }

  return deriveGroupName(connectors.map((c) => c.name));
}

function deriveGroupName(names: string[]): string {
  if (names.length === 1) return formatConnectorName(names[0]);

  const parts = names.map((n) => n.replace(/^JUMPER_/, "").split("_"));
  const suffixes = parts.map((p) => p.slice(1).join(" "));
  const uniqueSuffixes = [...new Set(suffixes)];
  const suffix = uniqueSuffixes.length === 1 ? uniqueSuffixes[0] : "";

  const prefixes = parts.map((p) => p[0]);
  const prefixLabel = compressNames(prefixes);

  const label = suffix ? `${prefixLabel} ${suffix}` : prefixLabel;
  return label
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function compressNames(names: string[]): string {
  const numbered = names
    .map((n) => {
      const match = n.match(/^(.+?)(\d+)$/);
      return match ? { base: match[1], num: Number.parseInt(match[2], 10) } : null;
    })
    .filter((x): x is { base: string; num: number } => x !== null);

  if (numbered.length === names.length && numbered.length > 1) {
    const base = numbered[0].base;
    if (numbered.every((n) => n.base === base)) {
      const nums = numbered.map((n) => n.num).sort((a, b) => a - b);
      return `${base}${nums[0]}\u2013${base}${nums[nums.length - 1]}`;
    }
  }

  return names.join(", ");
}

function formatConnectorName(name: string): string {
  return name
    .replace(/^JUMPER_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DocBoardPage({ boardId }: DocBoardPageProps) {
  const { boardIndex } = useMcu();
  const boardMeta = boardIndex.find((b) => b.id === boardId);
  const board = useDocDataQuery(loadMcuBoard, boardId);
  const pcbLayout = useOptionalDocDataQuery(loadPcbLayout, boardId);

  const jumperGroups = useMemo(() => (pcbLayout ? buildJumperGroups(pcbLayout) : []), [pcbLayout]);
  const buttons = useMemo(
    () => (pcbLayout ? pcbLayout.connectors.filter((c) => c.category === "button") : []),
    [pcbLayout],
  );

  return (
    <DocPageShell>
      <h1 className="text-2xl font-bold">{board.name}</h1>

      {(boardMeta?.hasImage || pcbLayout) && (
        <Tabs key={pcbLayout ? "with-pcb" : "no-pcb"} defaultValue={pcbLayout ? "pcb" : "photo"} className="mt-4">
          <TabsList variant="line">
            {boardMeta?.hasImage && <TabsTrigger value="photo">Product Photo</TabsTrigger>}
            {pcbLayout && <TabsTrigger value="pcb">Interactive PCB</TabsTrigger>}
          </TabsList>
          {boardMeta?.hasImage && (
            <TabsContent value="photo">
              <img
                src={`/data/mcu-boards/images/${boardId}.png`}
                alt={board.name}
                className="max-h-64 rounded border object-contain"
              />
            </TabsContent>
          )}
          {pcbLayout && (
            <TabsContent value="pcb">
              <DocPcbViewer layout={pcbLayout} />
            </TabsContent>
          )}
        </Tabs>
      )}

      <div className="mt-4">
        <SpecRow icon={Cpu} label="MCU" value={board.mcu}>
          <code className="bg-muted rounded px-1.5 py-0.5">{board.mcu}</code>
          {board.mcuVariants?.map((variant) => (
            <code key={variant} className="bg-muted rounded px-1.5 py-0.5">
              {variant}
            </code>
          ))}
        </SpecRow>
      </div>

      {board.drivers && (
        <div className="mt-2">
          <SpecRow icon={Cog} label="Drivers" value={String(board.drivers.count)}>
            <span>
              {board.drivers.count}x{" "}
              {board.drivers.model
                ? `${board.drivers.model} (integrated)`
                : board.drivers.connector === "ez"
                  ? "EZ sockets"
                  : "stepstick sockets"}
            </span>
          </SpecRow>
        </div>
      )}

      {board.dimensions && (
        <div className="mt-2">
          <SpecRow
            icon={Ruler}
            label="Dimensions"
            value={`${board.dimensions.width} × ${board.dimensions.height} mm`}
          />
        </div>
      )}

      {board.maxMotorVoltage && (
        <div className="mt-2">
          <SpecRow icon={Zap} label="Max Motor Voltage" value={board.maxMotorVoltage} suffix="V" />
        </div>
      )}

      <RelatedArticles articles={board.relatedArticles} />
      <ReferenceList references={board.references} />

      {jumperGroups.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Jumper Configuration</h2>
          <div className="space-y-4">
            {jumperGroups.map((group) => (
              <div key={group.connectorNames.join(",")} className="rounded border p-3">
                <h3 className="text-sm font-medium">{group.name}</h3>
                {group.connectorNames.length > 1 && (
                  <p className="text-muted-foreground mt-0.5 text-xs">{group.connectorNames.join(", ")}</p>
                )}
                <div className="mt-2">
                  {group.isDipSwitch ? (
                    <DipSwitchDiagram options={group.options} size="lg" />
                  ) : (
                    <JumperPinDiagram connector={group.connector} options={group.options} size="lg" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {buttons.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Buttons</h2>
          <div className="flex flex-wrap gap-2">
            {buttons.map((btn) => (
              <span key={`${btn.name}-${btn.x}-${btn.y}`} className="rounded border px-3 py-1.5 text-sm">
                {btn.title ?? btn.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {board.aliases && Object.keys(board.aliases).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Pin Aliases</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-3 py-2 text-left font-medium">Alias</th>
                  <th className="px-3 py-2 text-left font-medium">Pin</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(board.aliases)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([alias, pin]) => (
                    <tr key={alias} className="border-b last:border-0">
                      <td className="px-3 py-1.5 font-mono">{alias}</td>
                      <td className="px-3 py-1.5 font-mono">{pin}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {board.pins.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Available Pins</h2>
          <div className="flex flex-wrap gap-1">
            {board.pins.map((pin) => (
              <code key={pin} className="bg-muted rounded px-1.5 py-0.5 text-xs">
                {pin}
              </code>
            ))}
          </div>
        </div>
      )}
    </DocPageShell>
  );
}
