import { describe, expect, it, vi } from "vitest";
import {
  loadAccessory,
  loadDisplay,
  loadFilament,
  loadMcuBoard,
  loadPrinterIndex,
  resolvePresetVariant,
} from "../loaders.js";
import type { PrinterPreset } from "../types.js";

describe("loaders", () => {
  it("loadPrinterIndex fetches the printer index", async () => {
    const mockData = {
      printers: [{ id: "voron-2.4", name: "Voron 2.4", manufacturer: "VORON Design" }],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await loadPrinterIndex();
    expect(result.printers).toHaveLength(1);
    expect(result.printers[0].id).toBe("voron-2.4");
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/printers/index.json");
  });

  it("throws on fetch failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    await expect(loadPrinterIndex()).rejects.toThrow("Failed to load");
  });

  it("loadMcuBoard loads board with aliases", async () => {
    const mockBoard = {
      id: "btt-octopus-pro-1.1",
      name: "Bigtreetech Octopus Pro v1.1",
      mcu: "STM32F446",
      pins: ["PA0", "PA1"],
      aliases: {
        FAN0: "PA8",
        DRIVER0_STEP: "PF13",
        EXP1_1: "PE8",
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBoard),
    });

    const result = await loadMcuBoard("btt-octopus-pro-1.1");
    expect(result.aliases).toBeDefined();
    expect(result.aliases?.FAN0).toBe("PA8");
    expect(result.aliases?.DRIVER0_STEP).toBe("PF13");
    expect(result.aliases?.EXP1_1).toBe("PE8");
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/mcu-boards/btt-octopus-pro-1.1.json");
  });

  it("loadAccessory fetches an accessory by ID", async () => {
    const mockData = {
      id: "btt-sfs-v2",
      name: "Smart Filament Sensor V2.0",
      manufacturer: "BIGTREETECH",
      description: "Smart filament sensor",
      accessoryType: "filament-sensor",
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await loadAccessory("btt-sfs-v2");
    expect(result.id).toBe("btt-sfs-v2");
    expect(result.accessoryType).toBe("filament-sensor");
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/accessories/btt-sfs-v2.json");
  });

  it("loadFilament fetches a filament by ID", async () => {
    const mockData = {
      id: "generic-pla",
      name: "PLA",
      manufacturer: "Generic",
      description: "Polylactic acid",
      filamentType: "PLA",
      printSpecs: { nozzleTempRange: "190–220°C", bedTempRange: "50–60°C" },
      physicalSpecs: { diameter: 1.75 },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await loadFilament("generic-pla");
    expect(result.id).toBe("generic-pla");
    expect(result.filamentType).toBe("PLA");
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/filaments/generic-pla.json");
  });

  it("loadDisplay fetches a display by ID", async () => {
    const mockData = {
      id: "btt-knomi-v2.0",
      name: "KNOMI V2.0",
      manufacturer: "BigTreeTech",
      description: "Round WiFi display",
      displayType: "standalone",
      screenSpecs: { size: "1.28 inch", resolution: "240x240" },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await loadDisplay("btt-knomi-v2.0");
    expect(result.id).toBe("btt-knomi-v2.0");
    expect(result.displayType).toBe("standalone");
    expect(globalThis.fetch).toHaveBeenCalledWith("/data/displays/btt-knomi-v2.0.json");
  });

  it("loadMcuBoard loads board without aliases", async () => {
    const mockBoard = {
      id: "generic-stm32f446",
      name: "Generic STM32F446",
      mcu: "STM32F446",
      pins: ["PA0"],
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBoard),
    });

    const result = await loadMcuBoard("generic-stm32f446");
    expect(result.aliases).toBeUndefined();
  });
});

describe("resolvePresetVariant", () => {
  const legacyPreset: PrinterPreset = {
    id: "ender-3",
    name: "Ender 3",
    manufacturer: "Creality",
    description: "Popular budget printer",
    kinematics: "cartesian",
    bedSize: { x: 220, y: 220, z: 250 },
    defaults: {
      sections: [{ definitionId: "printer", data: { kinematics: "cartesian" } }],
    },
  };

  const variantPreset: PrinterPreset = {
    id: "voron-2.4",
    name: "Voron 2.4",
    manufacturer: "VORON Design",
    description: "CoreXY printer",
    variants: [
      {
        id: "350",
        name: "350mm",
        kinematics: "corexy",
        bedSize: { x: 350, y: 350, z: 340 },
        defaults: {
          sections: [{ definitionId: "printer", data: { kinematics: "corexy" } }],
        },
      },
      {
        id: "300",
        name: "300mm",
        kinematics: "corexy",
        bedSize: { x: 300, y: 300, z: 290 },
        defaults: {
          sections: [{ definitionId: "printer", data: { kinematics: "corexy" } }],
        },
      },
    ],
  };

  it("resolves legacy preset without variants", () => {
    const resolved = resolvePresetVariant(legacyPreset);
    expect(resolved.id).toBe("ender-3");
    expect(resolved.kinematics).toBe("cartesian");
    expect(resolved.bedSize).toEqual({ x: 220, y: 220, z: 250 });
    expect(resolved.defaults.sections).toHaveLength(1);
  });

  it("resolves first variant when no variantId given", () => {
    const resolved = resolvePresetVariant(variantPreset);
    expect(resolved.kinematics).toBe("corexy");
    expect(resolved.bedSize).toEqual({ x: 350, y: 350, z: 340 });
  });

  it("resolves specific variant by id", () => {
    const resolved = resolvePresetVariant(variantPreset, "300");
    expect(resolved.bedSize).toEqual({ x: 300, y: 300, z: 290 });
  });

  it("throws for unknown variant id", () => {
    expect(() => resolvePresetVariant(variantPreset, "400")).toThrow('Variant "400" not found in preset "voron-2.4"');
  });

  it("throws for preset with no variants and missing fields", () => {
    const broken: PrinterPreset = {
      id: "broken",
      name: "Broken",
      manufacturer: "Test",
      description: "Missing fields",
    };
    expect(() => resolvePresetVariant(broken)).toThrow("missing required fields");
  });
});
