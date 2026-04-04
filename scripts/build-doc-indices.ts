import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = join(import.meta.dirname, "..", "data");
const OUTPUT_PATH = join(DATA_DIR, "doc-indices.json");

interface CategoryMapping {
  dir: string;
  key: string;
  arrayField: string;
}

const CATEGORIES: CategoryMapping[] = [
  { dir: "mcu-boards", key: "boards", arrayField: "boards" },
  { dir: "printers", key: "printers", arrayField: "printers" },
  { dir: "stepper-motors", key: "motors", arrayField: "motors" },
  { dir: "probes", key: "probes", arrayField: "probes" },
  { dir: "fans", key: "fans", arrayField: "fans" },
  { dir: "thermistors", key: "thermistors", arrayField: "thermistors" },
  { dir: "extruders", key: "extruders", arrayField: "extruders" },
  { dir: "hotends", key: "hotends", arrayField: "hotends" },
  { dir: "power-supplies", key: "powerSupplies", arrayField: "powerSupplies" },
  { dir: "accessories", key: "accessories", arrayField: "accessories" },
  { dir: "filaments", key: "filaments", arrayField: "filaments" },
  { dir: "displays", key: "displays", arrayField: "displays" },
  { dir: "pcb-layouts", key: "pcbLayouts", arrayField: "layouts" },
];

async function buildDocIndices() {
  const result: Record<string, unknown[]> = {};

  for (const { dir, key, arrayField } of CATEGORIES) {
    const indexPath = join(DATA_DIR, dir, "index.json");
    const raw = await readFile(indexPath, "utf-8");
    const parsed = JSON.parse(raw);
    result[key] = parsed[arrayField];
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`);

  const dirs = await readdir(DATA_DIR, { withFileTypes: true });
  const categoryCount = CATEGORIES.length;
  const totalItems = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`Built doc-indices.json: ${categoryCount} categories, ${totalItems} items`);
}

buildDocIndices();
