import { describe, expect, it } from "vitest";
import { generateDotConfig } from "../services/config-generator";
import type { FirmwarePreset } from "../types";

const testPreset: FirmwarePreset = {
  mcuFamily: "STM32F407",
  mcuPatterns: ["STM32F407"],
  outputFile: "klipper.bin",
  base: {
    CONFIG_MACH_STM32: "y",
    CONFIG_MACH_STM32F407: "y",
  },
  interfaces: {
    usb: {
      label: "USB",
      config: { CONFIG_USB: "y" },
    },
    can: {
      label: "CAN bus",
      config: { CONFIG_CAN: "y" },
      options: [
        {
          key: "CONFIG_CANBUS_FREQUENCY",
          label: "CAN bus speed",
          type: "select",
          values: ["500000", "1000000"],
          default: "1000000",
        },
      ],
    },
  },
  bootloaderOffsets: {
    none: {
      label: "No bootloader",
      config: { CONFIG_FLASH_START_0000: "y" },
    },
    "32KiB": {
      label: "32KiB bootloader",
      config: { CONFIG_FLASH_START_8000: "y" },
    },
  },
  clockRefs: {
    "8MHz": {
      label: "8 MHz crystal",
      config: { CONFIG_CLOCK_REF_8M: "y" },
    },
  },
};

describe("generateDotConfig", () => {
  it("generates basic config from preset", () => {
    const result = generateDotConfig(testPreset, "usb");
    expect(result).toContain("CONFIG_MACH_STM32=y");
    expect(result).toContain("CONFIG_USB=y");
  });

  it("strips newlines from CONFIG_INITIAL_PINS", () => {
    const result = generateDotConfig(testPreset, "usb", {
      CONFIG_INITIAL_PINS: "PA0\nCONFIG_MALICIOUS=y",
    });
    expect(result).not.toContain("CONFIG_MALICIOUS");
    // The pin list contains a newline so it should fail pin validation entirely
    expect(result).not.toContain("CONFIG_INITIAL_PINS");
  });

  it("accepts valid CONFIG_INITIAL_PINS", () => {
    const result = generateDotConfig(testPreset, "usb", {
      CONFIG_INITIAL_PINS: "PA0,!PB3",
    });
    expect(result).toContain('CONFIG_INITIAL_PINS="PA0,!PB3"');
  });

  it("rejects CONFIG_INITIAL_PINS with shell metacharacters", () => {
    const result = generateDotConfig(testPreset, "usb", {
      CONFIG_INITIAL_PINS: "PA0;rm -rf /",
    });
    expect(result).not.toContain("CONFIG_INITIAL_PINS");
  });

  it("validates interface option values against preset allowed list", () => {
    const result = generateDotConfig(testPreset, "can", {
      CONFIG_CANBUS_FREQUENCY: "1000000",
    });
    expect(result).toContain("CONFIG_CANBUS_FREQUENCY=1000000");
  });

  it("rejects interface option values not in the allowed list", () => {
    const result = generateDotConfig(testPreset, "can", {
      CONFIG_CANBUS_FREQUENCY: "9999999\nCONFIG_EVIL=y",
    });
    expect(result).not.toContain("CONFIG_CANBUS_FREQUENCY");
    expect(result).not.toContain("CONFIG_EVIL");
  });

  it("ignores unknown option keys", () => {
    const result = generateDotConfig(testPreset, "usb", {
      CONFIG_UNKNOWN_OPTION: "y",
    });
    expect(result).not.toContain("CONFIG_UNKNOWN_OPTION");
  });

  it("validates bootloaderOffset key exists in preset", () => {
    const result = generateDotConfig(testPreset, "usb", {
      bootloaderOffset: "32KiB",
    });
    expect(result).toContain("CONFIG_FLASH_START_8000=y");
  });

  it("ignores invalid bootloaderOffset key", () => {
    const result = generateDotConfig(testPreset, "usb", {
      bootloaderOffset: "nonexistent",
    });
    // Should not contain any bootloader offset config since the key is invalid
    expect(result).not.toContain("CONFIG_FLASH_START_8000");
    expect(result).not.toContain("CONFIG_FLASH_START_0000");
  });

  it("validates clockRef key exists in preset", () => {
    const result = generateDotConfig(testPreset, "usb", {
      clockRef: "8MHz",
    });
    expect(result).toContain("CONFIG_CLOCK_REF_8M=y");
  });

  it("ignores invalid clockRef key", () => {
    const result = generateDotConfig(testPreset, "usb", {
      clockRef: "nonexistent",
    });
    expect(result).not.toContain("CONFIG_CLOCK_REF_8M");
  });

  it("defaults bootloader/clock to first entry when not specified", () => {
    const result = generateDotConfig(testPreset, "usb");
    expect(result).toContain("CONFIG_FLASH_START_0000=y");
    expect(result).toContain("CONFIG_CLOCK_REF_8M=y");
  });

  it("rejects prototype keys as bootloaderOffset", () => {
    for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      const result = generateDotConfig(testPreset, "usb", {
        bootloaderOffset: key,
      });
      expect(result).not.toContain("CONFIG_FLASH_START_0000");
      expect(result).not.toContain("CONFIG_FLASH_START_8000");
    }
  });

  it("rejects prototype keys as clockRef", () => {
    for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      const result = generateDotConfig(testPreset, "usb", {
        clockRef: key,
      });
      expect(result).not.toContain("CONFIG_CLOCK_REF_8M");
    }
  });

  it("rejects CONFIG_INITIAL_PINS with double quotes", () => {
    const result = generateDotConfig(testPreset, "usb", {
      CONFIG_INITIAL_PINS: 'PA0" CONFIG_EVIL=y #',
    });
    expect(result).not.toContain("CONFIG_INITIAL_PINS");
    expect(result).not.toContain("CONFIG_EVIL");
  });
});
