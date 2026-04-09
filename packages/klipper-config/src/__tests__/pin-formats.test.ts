import { describe, expect, it } from "vitest";
import { isVirtualEndstop, MCU_PIN_FAMILIES, matchesKnownPinFormat } from "../pin-formats";

describe("MCU_PIN_FAMILIES", () => {
  const familyMap = Object.fromEntries(MCU_PIN_FAMILIES.map((f) => [f.id, f.pattern]));

  describe("STM32", () => {
    const pattern = familyMap.stm32;

    it("matches valid STM32 pins", () => {
      expect(pattern.test("PA0")).toBe(true);
      expect(pattern.test("PB13")).toBe(true);
      expect(pattern.test("PK7")).toBe(true);
    });

    it("rejects invalid STM32 pins", () => {
      expect(pattern.test("PZ0")).toBe(false);
      expect(pattern.test("PA")).toBe(false);
      expect(pattern.test("PA123")).toBe(false);
      expect(pattern.test("pa0")).toBe(false);
    });
  });

  describe("RP2040", () => {
    const pattern = familyMap.rp2040;

    it("matches valid RP2040 pins", () => {
      expect(pattern.test("gpio0")).toBe(true);
      expect(pattern.test("gpio29")).toBe(true);
      expect(pattern.test("gpio5")).toBe(true);
    });

    it("rejects invalid RP2040 pins", () => {
      expect(pattern.test("GPIO0")).toBe(false);
      expect(pattern.test("gpio")).toBe(false);
      expect(pattern.test("gpio123")).toBe(false);
    });
  });

  describe("SAMD", () => {
    const pattern = familyMap.samd;

    it("matches valid SAMD pins", () => {
      expect(pattern.test("PA00")).toBe(true);
      expect(pattern.test("PB31")).toBe(true);
    });

    it("rejects invalid SAMD pins", () => {
      expect(pattern.test("PC00")).toBe(false);
      expect(pattern.test("PA0")).toBe(false);
      expect(pattern.test("PA123")).toBe(false);
    });
  });

  describe("LPC", () => {
    const pattern = familyMap.lpc;

    it("matches valid LPC pins", () => {
      expect(pattern.test("P0.0")).toBe(true);
      expect(pattern.test("P1.18")).toBe(true);
      expect(pattern.test("P2.5")).toBe(true);
    });

    it("rejects invalid LPC pins", () => {
      expect(pattern.test("P0")).toBe(false);
      expect(pattern.test("P0.")).toBe(false);
      expect(pattern.test("P0.123")).toBe(false);
    });
  });

  describe("ATmega", () => {
    const pattern = familyMap.atmega;

    it("matches valid ATmega pins", () => {
      expect(pattern.test("PA0")).toBe(true);
      expect(pattern.test("PB7")).toBe(true);
      expect(pattern.test("ar10")).toBe(true);
      expect(pattern.test("analog0")).toBe(true);
      expect(pattern.test("analog15")).toBe(true);
    });

    it("rejects invalid ATmega pins", () => {
      expect(pattern.test("ar")).toBe(false);
      expect(pattern.test("analog")).toBe(false);
    });
  });
});

describe("matchesKnownPinFormat", () => {
  it("returns true for valid pins", () => {
    expect(matchesKnownPinFormat("PA0")).toBe(true);
    expect(matchesKnownPinFormat("gpio5")).toBe(true);
    expect(matchesKnownPinFormat("P0.1")).toBe(true);
  });

  it("returns false for invalid pins", () => {
    expect(matchesKnownPinFormat("HELLO")).toBe(false);
    expect(matchesKnownPinFormat("my_pin")).toBe(false);
    expect(matchesKnownPinFormat("")).toBe(false);
  });
});

describe("isVirtualEndstop", () => {
  it("detects virtual endstop patterns", () => {
    expect(isVirtualEndstop("probe:z_virtual_endstop")).toBe(true);
    expect(isVirtualEndstop("tmc2209_stepper_x:virtual_endstop")).toBe(true);
  });

  it("rejects non-virtual-endstop pins", () => {
    expect(isVirtualEndstop("PA0")).toBe(false);
    expect(isVirtualEndstop("virtual_endstop")).toBe(false);
    expect(isVirtualEndstop(":virtual_endstop")).toBe(false);
  });
});
