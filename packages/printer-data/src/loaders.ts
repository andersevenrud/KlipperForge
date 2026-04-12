import type {
  Accessory,
  Display,
  DocIndices,
  Extruder,
  Fan,
  Filament,
  Hotend,
  McuBoard,
  McuBoardIndex,
  Mmu,
  PcbLayout,
  PcbLayoutIndex,
  PowerSupply,
  PrinterIndex,
  PrinterPreset,
  Probe,
  ResolvedPreset,
  StepperDriver,
  StepperMotor,
  Thermistor,
  Toolhead,
} from "./types.js";

const DATA_BASE_PATH = "/data";

/**
 * Thrown by the data loaders when a requested JSON file does not exist
 * (HTTP 404). Callers can distinguish this from other fetch failures to
 * render a dedicated "not found" view instead of a generic error.
 */
export class NotFoundError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Not found: ${path}`);
    this.name = "NotFoundError";
    this.path = path;
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE_PATH}${path}`);
  if (response.status === 404) {
    throw new NotFoundError(path);
  }
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`);
  }
  // Vite's dev server falls back to index.html (200 OK, text/html) for any
  // unknown path under /data, so a missing id there looks like a successful
  // response until JSON.parse chokes. Detect the fallback via the response
  // content-type when available, and also treat JSON parse failures on this
  // path as 404s since the only valid payload here is JSON.
  const contentType = response.headers?.get?.("content-type") ?? "";
  if (contentType && !contentType.includes("json")) {
    throw new NotFoundError(path);
  }
  try {
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new NotFoundError(path);
    }
    throw err;
  }
}

export interface DataLoader<T> {
  (id: string): Promise<T>;
  loaderKey: string;
}

export interface IndexLoader<T> {
  (): Promise<T>;
  loaderKey: string;
}

function createItemLoader<T>(path: string): DataLoader<T> {
  return Object.assign((id: string) => fetchJson<T>(`/${path}/${id}.json`), { loaderKey: `item:${path}` });
}

function createIndexLoader<T>(path: string): IndexLoader<T> {
  return Object.assign(() => fetchJson<T>(`/${path}/index.json`), { loaderKey: `index:${path}` });
}

export const loadPrinterIndex = createIndexLoader<PrinterIndex>("printers");
export const loadPrinterPreset = createItemLoader<PrinterPreset>("printers");
export const loadMcuBoardIndex = createIndexLoader<McuBoardIndex>("mcu-boards");
export const loadMcuBoard = createItemLoader<McuBoard>("mcu-boards");
export const loadPcbLayoutIndex = createIndexLoader<PcbLayoutIndex>("pcb-layouts");
export const loadPcbLayout = createItemLoader<PcbLayout>("pcb-layouts");
export const loadProbe = createItemLoader<Probe>("probes");
export const loadStepperMotor = createItemLoader<StepperMotor>("stepper-motors");
export const loadFan = createItemLoader<Fan>("fans");
export const loadThermistor = createItemLoader<Thermistor>("thermistors");
export const loadExtruder = createItemLoader<Extruder>("extruders");
export const loadHotend = createItemLoader<Hotend>("hotends");

export function resolvePresetVariant(preset: PrinterPreset, variantId?: string): ResolvedPreset {
  const { id, name, manufacturer, description } = preset;

  if (preset.variants && preset.variants.length > 0) {
    const variant = variantId ? preset.variants.find((v) => v.id === variantId) : preset.variants[0];
    if (!variant) {
      throw new Error(`Variant "${variantId}" not found in preset "${id}"`);
    }
    return {
      id,
      name,
      manufacturer,
      description,
      kinematics: variant.kinematics,
      bedSize: variant.bedSize,
      defaults: variant.defaults,
    };
  }

  if (!preset.kinematics || !preset.bedSize || !preset.defaults) {
    throw new Error(`Preset "${id}" has no variants and is missing required fields`);
  }

  return {
    id,
    name,
    manufacturer,
    description,
    kinematics: preset.kinematics,
    bedSize: preset.bedSize,
    defaults: preset.defaults,
  };
}

export const loadPowerSupply = createItemLoader<PowerSupply>("power-supplies");
export const loadAccessory = createItemLoader<Accessory>("accessories");
export const loadFilament = createItemLoader<Filament>("filaments");
export const loadDisplay = createItemLoader<Display>("displays");
export const loadToolhead = createItemLoader<Toolhead>("toolheads");
export const loadMmu = createItemLoader<Mmu>("mmus");
export const loadStepperDriver = createItemLoader<StepperDriver>("stepper-drivers");

export async function loadDocIndices(): Promise<DocIndices> {
  return fetchJson<DocIndices>("/doc-indices.json");
}
