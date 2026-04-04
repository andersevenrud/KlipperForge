import { describe, expect, it } from "vitest";
import { SECTION_MODES, getSectionModeConfig, isTmcSection } from "../sections/section-modes";

describe("isTmcSection", () => {
  it("returns true for TMC driver IDs", () => {
    expect(isTmcSection("tmc2130")).toBe(true);
    expect(isTmcSection("tmc2208")).toBe(true);
    expect(isTmcSection("tmc2209")).toBe(true);
    expect(isTmcSection("tmc2240")).toBe(true);
    expect(isTmcSection("tmc2660")).toBe(true);
    expect(isTmcSection("tmc5160")).toBe(true);
  });

  it("returns false for non-TMC IDs", () => {
    expect(isTmcSection("stepper_x")).toBe(false);
    expect(isTmcSection("extruder")).toBe(false);
    expect(isTmcSection("mcu")).toBe(false);
  });
});

describe("getSectionModeConfig", () => {
  it("returns config for TMC sections", () => {
    expect(getSectionModeConfig("tmc2209")).toBeDefined();
    expect(getSectionModeConfig("tmc2130")).toBeDefined();
  });

  it("returns config for MCU sections", () => {
    expect(getSectionModeConfig("mcu")).toBeDefined();
    expect(getSectionModeConfig("mcu_named")).toBeDefined();
  });

  it("returns undefined for unknown sections", () => {
    expect(getSectionModeConfig("extruder")).toBeUndefined();
    expect(getSectionModeConfig("stepper_x")).toBeUndefined();
  });
});

describe("TMC mode detection", () => {
  const tmc2209 = SECTION_MODES.tmc2209;
  const tmc2130 = SECTION_MODES.tmc2130;
  const tmc2240 = SECTION_MODES.tmc2240;

  it("detects UART mode when uart_pin is set", () => {
    expect(tmc2209.detect({ uart_pin: "PA10" })).toBe("uart");
  });

  it("detects SPI mode when cs_pin is set", () => {
    expect(tmc2130.detect({ cs_pin: "PA4" })).toBe("spi");
  });

  it("detects standalone when no communication pins are set", () => {
    expect(tmc2209.detect({})).toBe("standalone");
  });

  it('detects standalone when cs_pin is "None"', () => {
    expect(tmc2130.detect({ cs_pin: "None" })).toBe("standalone");
  });

  it("prefers UART over SPI for tmc2240", () => {
    expect(tmc2240.detect({ uart_pin: "PA10", cs_pin: "PA4" })).toBe("uart");
  });
});

describe("TMC hidden fields", () => {
  const tmc2240 = SECTION_MODES.tmc2240;
  const tmc2209 = SECTION_MODES.tmc2209;
  const tmc2130 = SECTION_MODES.tmc2130;

  it("hides UART fields in SPI mode", () => {
    const hidden = tmc2240.getHiddenFields("spi");
    expect(hidden.has("uart_pin")).toBe(true);
    expect(hidden.has("tx_pin")).toBe(true);
    expect(hidden.has("cs_pin")).toBe(false);
  });

  it("hides SPI fields in UART mode", () => {
    const hidden = tmc2209.getHiddenFields("uart");
    expect(hidden.has("cs_pin")).toBe(true);
    expect(hidden.has("spi_bus")).toBe(true);
    expect(hidden.has("uart_pin")).toBe(false);
  });

  it("hides both SPI and UART fields in standalone mode", () => {
    const hidden = tmc2130.getHiddenFields("standalone");
    expect(hidden.has("cs_pin")).toBe(true);
    expect(hidden.has("uart_pin")).toBe(true);
  });
});

describe("MCU mode detection", () => {
  const mcu = SECTION_MODES.mcu;
  const mcuNamed = SECTION_MODES.mcu_named;

  it("detects canbus mode when canbus_uuid is set", () => {
    expect(mcu.detect({ canbus_uuid: "abc123" })).toBe("canbus");
  });

  it("detects serial mode when no canbus_uuid", () => {
    expect(mcu.detect({ serial: "/dev/ttyUSB0" })).toBe("serial");
  });

  it("defaults to serial when data is empty", () => {
    expect(mcu.detect({})).toBe("serial");
  });

  it("works for mcu_named", () => {
    expect(mcuNamed.detect({ canbus_uuid: "def456" })).toBe("canbus");
    expect(mcuNamed.detect({})).toBe("serial");
  });
});

describe("MCU hidden fields", () => {
  const mcu = SECTION_MODES.mcu;

  it("hides canbus fields in serial mode", () => {
    const hidden = mcu.getHiddenFields("serial");
    expect(hidden.has("canbus_uuid")).toBe(true);
    expect(hidden.has("canbus_interface")).toBe(true);
    expect(hidden.has("serial")).toBe(false);
  });

  it("hides serial field in canbus mode", () => {
    const hidden = mcu.getHiddenFields("canbus");
    expect(hidden.has("serial")).toBe(true);
    expect(hidden.has("canbus_uuid")).toBe(false);
    expect(hidden.has("canbus_interface")).toBe(false);
  });

  it("never hides baud or restart_method", () => {
    for (const mode of ["serial", "canbus"]) {
      const hidden = mcu.getHiddenFields(mode);
      expect(hidden.has("baud")).toBe(false);
      expect(hidden.has("restart_method")).toBe(false);
    }
  });
});
