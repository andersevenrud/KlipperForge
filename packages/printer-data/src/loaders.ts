import type {
  Accessory,
  AccessoryIndex,
  Display,
  DisplayIndex,
  DocIndices,
  EquipmentCategory,
  EquipmentItem,
  Extruder,
  ExtruderIndex,
  Fan,
  FanIndex,
  Filament,
  FilamentIndex,
  Hotend,
  HotendIndex,
  MacroTemplate,
  McuBoard,
  McuBoardIndex,
  Mmu,
  MmuIndex,
  PcbLayout,
  PcbLayoutIndex,
  PowerSupply,
  PowerSupplyIndex,
  PrinterIndex,
  PrinterPreset,
  Probe,
  ProbeIndex,
  ResolvedPreset,
  StepperMotor,
  StepperMotorIndex,
  Thermistor,
  ThermistorIndex,
  Toolhead,
  ToolheadIndex,
} from "./types.js";

const DATA_BASE_PATH = "/data";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE_PATH}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function loadPrinterIndex(): Promise<PrinterIndex> {
  return fetchJson<PrinterIndex>("/printers/index.json");
}

export async function loadPrinterPreset(id: string): Promise<PrinterPreset> {
  return fetchJson<PrinterPreset>(`/printers/${id}.json`);
}

export async function loadEquipment(category: EquipmentCategory): Promise<EquipmentItem[]> {
  return fetchJson<EquipmentItem[]>(`/equipment/${category}.json`);
}

export async function loadAllEquipment(): Promise<EquipmentItem[]> {
  const categories: EquipmentCategory[] = ["fans", "probes", "sensors", "stepper-drivers"];
  const results = await Promise.all(categories.map(loadEquipment));
  return results.flat();
}

export async function loadMacros(category: string): Promise<MacroTemplate[]> {
  return fetchJson<MacroTemplate[]>(`/macros/${category}.json`);
}

export async function loadAllMacros(): Promise<MacroTemplate[]> {
  const categories = ["print-lifecycle", "movement"];
  const results = await Promise.all(categories.map(loadMacros));
  return results.flat();
}

export async function loadMcuBoardIndex(): Promise<McuBoardIndex> {
  return fetchJson<McuBoardIndex>("/mcu-boards/index.json");
}

export async function loadMcuBoard(id: string): Promise<McuBoard> {
  return fetchJson<McuBoard>(`/mcu-boards/${id}.json`);
}

export async function loadPcbLayoutIndex(): Promise<PcbLayoutIndex> {
  return fetchJson<PcbLayoutIndex>("/pcb-layouts/index.json");
}

export async function loadPcbLayout(boardId: string): Promise<PcbLayout> {
  return fetchJson<PcbLayout>(`/pcb-layouts/${boardId}.json`);
}

export async function loadProbeIndex(): Promise<ProbeIndex> {
  return fetchJson<ProbeIndex>("/probes/index.json");
}

export async function loadProbe(id: string): Promise<Probe> {
  return fetchJson<Probe>(`/probes/${id}.json`);
}

export async function loadStepperMotorIndex(): Promise<StepperMotorIndex> {
  return fetchJson<StepperMotorIndex>("/stepper-motors/index.json");
}

export async function loadStepperMotor(id: string): Promise<StepperMotor> {
  return fetchJson<StepperMotor>(`/stepper-motors/${id}.json`);
}

export async function loadFanIndex(): Promise<FanIndex> {
  return fetchJson<FanIndex>("/fans/index.json");
}

export async function loadFan(id: string): Promise<Fan> {
  return fetchJson<Fan>(`/fans/${id}.json`);
}

export async function loadThermistorIndex(): Promise<ThermistorIndex> {
  return fetchJson<ThermistorIndex>("/thermistors/index.json");
}

export async function loadThermistor(id: string): Promise<Thermistor> {
  return fetchJson<Thermistor>(`/thermistors/${id}.json`);
}

export async function loadExtruderIndex(): Promise<ExtruderIndex> {
  return fetchJson<ExtruderIndex>("/extruders/index.json");
}

export async function loadExtruder(id: string): Promise<Extruder> {
  return fetchJson<Extruder>(`/extruders/${id}.json`);
}

export async function loadHotendIndex(): Promise<HotendIndex> {
  return fetchJson<HotendIndex>("/hotends/index.json");
}

export async function loadHotend(id: string): Promise<Hotend> {
  return fetchJson<Hotend>(`/hotends/${id}.json`);
}

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

export async function loadPowerSupplyIndex(): Promise<PowerSupplyIndex> {
  return fetchJson<PowerSupplyIndex>("/power-supplies/index.json");
}

export async function loadPowerSupply(id: string): Promise<PowerSupply> {
  return fetchJson<PowerSupply>(`/power-supplies/${id}.json`);
}

export async function loadAccessoryIndex(): Promise<AccessoryIndex> {
  return fetchJson<AccessoryIndex>("/accessories/index.json");
}

export async function loadAccessory(id: string): Promise<Accessory> {
  return fetchJson<Accessory>(`/accessories/${id}.json`);
}

export async function loadFilamentIndex(): Promise<FilamentIndex> {
  return fetchJson<FilamentIndex>("/filaments/index.json");
}

export async function loadFilament(id: string): Promise<Filament> {
  return fetchJson<Filament>(`/filaments/${id}.json`);
}

export async function loadDisplayIndex(): Promise<DisplayIndex> {
  return fetchJson<DisplayIndex>("/displays/index.json");
}

export async function loadDisplay(id: string): Promise<Display> {
  return fetchJson<Display>(`/displays/${id}.json`);
}

export async function loadToolheadIndex(): Promise<ToolheadIndex> {
  return fetchJson<ToolheadIndex>("/toolheads/index.json");
}

export async function loadToolhead(id: string): Promise<Toolhead> {
  return fetchJson<Toolhead>(`/toolheads/${id}.json`);
}

export async function loadMmuIndex(): Promise<MmuIndex> {
  return fetchJson<MmuIndex>("/mmus/index.json");
}

export async function loadMmu(id: string): Promise<Mmu> {
  return fetchJson<Mmu>(`/mmus/${id}.json`);
}

export async function loadDocIndices(): Promise<DocIndices> {
  return fetchJson<DocIndices>("/doc-indices.json");
}
