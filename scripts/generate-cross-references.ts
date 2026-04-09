import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface IndexEntry {
  id: string;
  name: string;
}

interface RelatedArticle {
  category: string;
  id: string;
  name: string;
}

interface CategoryMapping {
  dir: string;
  arrayField: string;
}

interface EquipmentEntry {
  category?: string;
  id?: string;
  label?: string;
  role?: string;
}

interface MountGroup {
  mounts: string[];
  category: string;
  aliases: Record<string, string>;
  knownIds: Set<string>;
}

const DATA_DIR = join(import.meta.dirname, "..", "data");

const CATEGORIES: CategoryMapping[] = [
  { dir: "hotends", arrayField: "hotends" },
  { dir: "thermistors", arrayField: "thermistors" },
  { dir: "printers", arrayField: "printers" },
  { dir: "extruders", arrayField: "extruders" },
  { dir: "probes", arrayField: "probes" },
  { dir: "fans", arrayField: "fans" },
  { dir: "stepper-motors", arrayField: "motors" },
  { dir: "mcu-boards", arrayField: "boards" },
  { dir: "displays", arrayField: "displays" },
  { dir: "power-supplies", arrayField: "powerSupplies" },
  { dir: "accessories", arrayField: "accessories" },
  { dir: "filaments", arrayField: "filaments" },
];

const HOTEND_ALIASES: Record<string, string> = {
  "e3d v6": "e3d-v6",
  v6: "e3d-v6",
  "e3d v6.1": "e3d-v6.1",
  "e3d v6 groove mount": "e3d-v6",
  "v6 groove mount": "e3d-v6",
  "e3d revo voron": "e3d-revo-voron",
  "revo voron": "e3d-revo-voron",
  "e3d revo six": "e3d-revo-six",
  "revo six": "e3d-revo-six",
  "e3d revo micro": "e3d-revo-micro",
  "revo micro": "e3d-revo-micro",
  "e3d revo cr": "e3d-revo-cr",
  "e3d lite6": "e3d-lite6",
  "phaetus dragon sf": "phaetus-dragon-sf",
  "dragon sf": "phaetus-dragon-sf",
  "phaetus dragon standard flow": "phaetus-dragon-sf",
  "phaetus dragon hf": "phaetus-dragon-hf",
  "dragon hf": "phaetus-dragon-hf",
  "phaetus dragon high flow": "phaetus-dragon-hf",
  "phaetus dragon ace hf": "phaetus-dragon-hf",
  "phaetus rapido hf": "phaetus-rapido-hf",
  "rapido hf": "phaetus-rapido-hf",
  "phaetus rapido v1 hf": "phaetus-rapido-hf",
  "phaetus rapido v2 hf": "phaetus-rapido-hf",
  "phaetus rapido v2": "phaetus-rapido-hf",
  "phaetus rapido uhf": "phaetus-rapido-uhf",
  "rapido uhf": "phaetus-rapido-uhf",
  "phaetus dragonfly bmo": "phaetus-dragonfly-bmo",
  "phaetus dragonfly bms": "phaetus-dragonfly-bms",
  "phaetus dragonfly": "phaetus-dragonfly-bmo",
  "phaetus taichi": "phaetus-taichi",
  "slice mosquito": "slice-mosquito",
  mosquito: "slice-mosquito",
  "slice engineering mosquito": "slice-mosquito",
  "slice mosquito magnum plus": "slice-mosquito-magnum-plus",
  "mosquito magnum+": "slice-mosquito-magnum-plus",
  "slice copperhead": "slice-copperhead",
  "bondtech copperhead": "bondtech-copperhead",
  copperhead: "bondtech-copperhead",
  "nf-crazy": "mellow-nf-crazy",
  "mellow nf-crazy": "mellow-nf-crazy",
  "trianglelab chc pro": "trianglelab-chc-pro",
  "chc pro": "trianglelab-chc-pro",
  "trianglelab td6s": "trianglelab-td6s",
  "creality mk8": "creality-mk8",
  "creality k1": "creality-k1-hotend",
  "creality spider 3": "creality-spider-3",
  "creality spider": "creality-spider-3",
  "creality spider pro": "creality-spider-3",
  "micro swiss": "micro-swiss-all-metal",
  "dropeffect nextg": "dropeffect-nextg",
  "dropeffect next-g": "dropeffect-nextg",
  nextg: "dropeffect-nextg",
  "goliath air": "goliath-air",
  "goliath water": "goliath-water",
  "phaetus goliath": "goliath-air",
  goliath: "goliath-air",
  "phaetus goliath air": "goliath-air",
  "vz goliath": "goliath-air",
  "bambu lab hotend": "bambu-lab-hotend",
  bambulab: "bambu-lab-hotend",
  "bambulab x1c": "bambu-lab-hotend",
  "bambu lab x1": "bambu-lab-hotend",
  chube: "chube-hotend",
  "chube air": "chube-hotend",
  "chube compact": "chube-hotend",
  "prusa nextruder": "prusa-nextruder",
  "dragon ace": "phaetus-dragon-hf",
  "phaetus dragon ace": "phaetus-dragon-hf",
  "trianglelab dragon": "phaetus-dragon-sf",
};

const EXTRUDER_ALIASES: Record<string, string> = {
  "sherpa mini": "sherpa-mini",
  sherpa: "sherpa-mini",
  "annex sherpa": "sherpa-mini",
  "annex sherpa (cnc)": "sherpa-mini",
  "bondtech bmg": "bondtech-bmg",
  bmg: "bondtech-bmg",
  "bondtech lgx": "bondtech-lgx",
  lgx: "bondtech-lgx",
  "bondtech lgx lite": "bondtech-lgx-lite",
  "lgx lite": "bondtech-lgx-lite",
  "bondtech lgx lite pro": "bondtech-lgx-lite",
  "lgx lite pro": "bondtech-lgx-lite",
  "ldo orbiter v2": "ldo-orbiter-v2",
  "orbiter v2.0": "ldo-orbiter-v2",
  "orbiter v2": "ldo-orbiter-v2",
  "orbiter 2.0": "ldo-orbiter-v2",
  "orbiter 2": "ldo-orbiter-v2",
  orbiter: "ldo-orbiter-v2",
  "ldo orbiter v2.5": "ldo-orbiter-v2.5",
  "orbiter v2.5": "ldo-orbiter-v2.5",
  "orbiter 2.5": "ldo-orbiter-v2.5",
  "e3d titan": "e3d-titan",
  titan: "e3d-titan",
  "e3d hemera": "e3d-hemera",
  hemera: "e3d-hemera",
  "creality sprite pro": "creality-sprite-pro",
  "galileo 2 sa": "galileo-2-sa",
  "galileo 2 g2e": "galileo-2-g2e",
  "galileo g2sa": "galileo-2-sa",
  "galileo 2": "galileo-2-sa",
  g2sa: "galileo-2-sa",
  g2e: "galileo-2-g2e",
  g2: "galileo-2-g2e",
  "wristpin g2sa": "wristpin-g2sa",
  hextrudort: "hextrudort",
  "vz-hextrudort": "vz-hextrudort",
  "generic mk8": "generic-mk8",
  "prusa nextruder": "prusa-nextruder",
};

const PROBE_ALIASES: Record<string, string> = {
  "voron tap": "voron-tap",
  tap: "voron-tap",
  klicky: "klicky-probe",
  "klicky probe": "klicky-probe",
  "klicky pcb": "klicky-probe",
  euclid: "euclid-probe",
  "euclid probe": "euclid-probe",
  beacon: "beacon",
  "beacon rev h": "beacon-revh",
  beacon3d: "beacon",
  bltouch: "bltouch-v3.1",
  "bl touch": "bltouch-v3.1",
  "cr-touch": "cr-touch",
  "cr touch": "cr-touch",
  cartographer: "cartographer-3d",
  "cartographer 3d": "cartographer-3d",
  "cartographer v4": "cartographer-3d",
  superpinda: "superpinda",
  "super pinda": "superpinda",
  pinda: "pinda-v2",
  "btt eddy": "btt-eddy-coil",
  "bd sensor": "bd-sensor",
  "smart effector": "smart-effector",
  "biqu microprobe": "biqu-microprobe-v2",
};

async function loadIndex(dir: string, arrayField: string): Promise<IndexEntry[]> {
  const indexPath = join(DATA_DIR, dir, "index.json");
  const raw = await readFile(indexPath, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed[arrayField] as IndexEntry[];
}

async function loadJsonFile(filePath: string): Promise<Record<string, unknown>> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function listArticleFiles(dir: string): Promise<string[]> {
  const entries = await readdir(join(DATA_DIR, dir));
  return entries.filter((f) => f.endsWith(".json") && f !== "index.json");
}

function addRef(refs: Map<string, RelatedArticle[]>, articleKey: string, ref: RelatedArticle): void {
  const existing = refs.get(articleKey) ?? [];
  existing.push(ref);
  refs.set(articleKey, existing);
}

function articleKey(category: string, id: string): string {
  return `${category}/${id}`;
}

function getIndex(indexMap: Map<string, Map<string, string>>, dir: string): Map<string, string> {
  const index = indexMap.get(dir);
  if (!index) {
    throw new Error(`Missing index for category: ${dir}`);
  }
  return index;
}

function resolveAlias(text: string, aliases: Record<string, string>, knownIds: Set<string>): string | null {
  const normalized = text.toLowerCase().trim();

  // Try alias map first
  if (aliases[normalized]) {
    return aliases[normalized];
  }

  // Try slug-based fallback: replace spaces with hyphens
  const slug = normalized.replace(/\s+/g, "-");
  if (knownIds.has(slug)) {
    return slug;
  }

  return null;
}

async function generateCrossReferences() {
  // 1. Load all indices
  const indexMap = new Map<string, Map<string, string>>();

  for (const { dir, arrayField } of CATEGORIES) {
    const entries = await loadIndex(dir, arrayField);
    const idToName = new Map<string, string>();
    for (const entry of entries) {
      idToName.set(entry.id, entry.name);
    }
    indexMap.set(dir, idToName);
  }

  // Also try loading optional directories (toolheads, mmus)
  for (const { dir, arrayField } of [
    { dir: "toolheads", arrayField: "toolheads" },
    { dir: "mmus", arrayField: "mmus" },
  ]) {
    try {
      const entries = await loadIndex(dir, arrayField);
      const idToName = new Map<string, string>();
      for (const entry of entries) {
        idToName.set(entry.id, entry.name);
      }
      indexMap.set(dir, idToName);
    } catch {
      // Directory may not exist
    }
  }

  // Build known ID sets for alias resolution
  const hotendIds = new Set(indexMap.get("hotends")?.keys() ?? []);
  const extruderIds = new Set(indexMap.get("extruders")?.keys() ?? []);
  const probeIds = new Set(indexMap.get("probes")?.keys() ?? []);

  // Cross-reference accumulator: articleKey -> RelatedArticle[]
  const refs = new Map<string, RelatedArticle[]>();
  const unmatchedMounts: string[] = [];

  // 2A: Hotend -> Thermistor
  const hotendFiles = await listArticleFiles("hotends");
  const hotendIndex = getIndex(indexMap, "hotends");
  const thermistorIndex = getIndex(indexMap, "thermistors");

  for (const file of hotendFiles) {
    const hotendId = file.replace(".json", "");
    const filePath = join(DATA_DIR, "hotends", file);
    const data = await loadJsonFile(filePath);
    const thermalSpecs = data.thermalSpecs as Record<string, unknown> | undefined;
    const thermistorId = thermalSpecs?.thermistorId as string | undefined;

    if (thermistorId && thermistorIndex.has(thermistorId)) {
      const hotendName = hotendIndex.get(hotendId);
      const thermistorName = thermistorIndex.get(thermistorId);

      if (hotendName && thermistorName) {
        // Forward: hotend -> thermistor
        addRef(refs, articleKey("hotends", hotendId), {
          category: "thermistors",
          id: thermistorId,
          name: thermistorName,
        });

        // Reverse: thermistor -> hotend
        addRef(refs, articleKey("thermistors", thermistorId), {
          category: "hotends",
          id: hotendId,
          name: hotendName,
        });
      }
    }
  }

  // 2B: Printer -> Equipment (reverse only)
  const printerFiles = await listArticleFiles("printers");
  const printerIndex = getIndex(indexMap, "printers");

  for (const file of printerFiles) {
    const printerId = file.replace(".json", "");
    const filePath = join(DATA_DIR, "printers", file);
    const data = await loadJsonFile(filePath);
    const equipment = data.equipment as EquipmentEntry[] | undefined;
    const printerName = printerIndex.get(printerId);

    if (!equipment || !printerName) {
      continue;
    }

    for (const entry of equipment) {
      if (!entry.category || !entry.id) {
        continue;
      }

      const categoryIndex = indexMap.get(entry.category);
      if (!categoryIndex?.has(entry.id)) {
        continue;
      }

      // Reverse: equipment article -> printer
      addRef(refs, articleKey(entry.category, entry.id), {
        category: "printers",
        id: printerId,
        name: printerName,
      });
    }
  }

  // 2C: Toolhead -> Compatible Components (forward + reverse)
  const toolheadIndex = indexMap.get("toolheads");
  if (toolheadIndex && toolheadIndex.size > 0) {
    const toolheadFiles = await listArticleFiles("toolheads");

    for (const file of toolheadFiles) {
      const toolheadId = file.replace(".json", "");
      const filePath = join(DATA_DIR, "toolheads", file);
      const data = await loadJsonFile(filePath);
      const toolheadName = toolheadIndex.get(toolheadId);
      if (!toolheadName) {
        continue;
      }

      const compatSpecs = data.compatibilitySpecs as Record<string, unknown> | undefined;
      if (!compatSpecs) {
        continue;
      }

      const mountGroups: MountGroup[] = [
        {
          mounts: (compatSpecs.hotendMounts as string[]) ?? [],
          category: "hotends",
          aliases: HOTEND_ALIASES,
          knownIds: hotendIds,
        },
        {
          mounts: (compatSpecs.extruderMounts as string[]) ?? [],
          category: "extruders",
          aliases: EXTRUDER_ALIASES,
          knownIds: extruderIds,
        },
        {
          mounts: (compatSpecs.probeMounts as string[]) ?? [],
          category: "probes",
          aliases: PROBE_ALIASES,
          knownIds: probeIds,
        },
      ];

      for (const { mounts, category, aliases, knownIds } of mountGroups) {
        for (const mountText of mounts) {
          const resolvedId = resolveAlias(mountText, aliases, knownIds);
          if (!resolvedId) {
            unmatchedMounts.push(`[${toolheadId}] ${category}: "${mountText}"`);
            continue;
          }

          const componentIndex = indexMap.get(category);
          const componentName = componentIndex?.get(resolvedId);
          if (!componentName) {
            unmatchedMounts.push(
              `[${toolheadId}] ${category}: "${mountText}" (resolved to "${resolvedId}" but not in index)`,
            );
            continue;
          }

          // Forward: toolhead -> component
          addRef(refs, articleKey("toolheads", toolheadId), {
            category,
            id: resolvedId,
            name: componentName,
          });

          // Reverse: component -> toolhead
          addRef(refs, articleKey(category, resolvedId), {
            category: "toolheads",
            id: toolheadId,
            name: toolheadName,
          });
        }
      }
    }
  }

  // 3. Deduplicate and sort
  const dedupedRefs = new Map<string, RelatedArticle[]>();

  for (const [key, articles] of refs) {
    const seen = new Set<string>();
    const unique: RelatedArticle[] = [];
    for (const article of articles) {
      const dedupKey = `${article.category}/${article.id}`;
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        unique.push(article);
      }
    }
    unique.sort((a, b) => {
      const catCmp = a.category.localeCompare(b.category);
      if (catCmp !== 0) {
        return catCmp;
      }
      return a.name.localeCompare(b.name);
    });
    dedupedRefs.set(key, unique);
  }

  // 4. Write results
  let updatedCount = 0;
  let totalRefs = 0;

  for (const [key, articles] of dedupedRefs) {
    const [category, id] = key.split("/", 2);
    const filePath = join(DATA_DIR, category, `${id}.json`);

    try {
      const raw = await readFile(filePath, "utf-8");
      const data = JSON.parse(raw);
      data.relatedArticles = articles;
      await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
      updatedCount++;
      totalRefs += articles.length;
    } catch {
      console.warn(`Warning: could not update ${filePath}`);
    }
  }

  // 5. Print summary
  console.log("Cross-references generated:");
  console.log(`  ${updatedCount} articles updated`);
  console.log(`  ${totalRefs} cross-references total`);

  if (unmatchedMounts.length > 0) {
    console.log(`\nUnmatched toolhead mount strings (${unmatchedMounts.length}):`);
    for (const msg of unmatchedMounts) {
      console.log(`  ${msg}`);
    }
  }
}

generateCrossReferences();
