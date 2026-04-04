import { describe, expect, it } from "vitest";
import { cfgToDocument } from "../import";
import { createDefaultRegistry } from "../sections/schemas";
import type { ImportWarning } from "../sections/types";
import type { ConfigSection } from "../types";

describe("import lint: auto-fix conflicting mode fields", () => {
  const registry = createDefaultRegistry();

  it("preserves serial when canbus_uuid is present in MCU section", () => {
    const sections: ConfigSection[] = [
      {
        type: "mcu",
        name: "mcu",
        values: { serial: "/dev/ttyUSB0", canbus_uuid: "abc123", canbus_interface: "can0" },
      },
    ];

    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const mcu = doc.sections.find((s) => s.definitionId === "mcu");
    expect(mcu).toBeDefined();
    expect(mcu?.data.canbus_uuid).toBe("abc123");
    expect(mcu?.data.canbus_interface).toBe("can0");
    expect(mcu?.data.serial).toBe("/dev/ttyUSB0");
    expect(mcu?.meta?._mode).toBe("canbus");

    const modeWarnings = warnings.filter((w) => !w.autoFixed && w.message.includes("won't be output"));
    expect(modeWarnings).toHaveLength(1);
    expect(modeWarnings[0].message).toContain("serial");
    expect(modeWarnings[0].message).toContain("canbus");
  });

  it("sets mode to serial when only serial is present", () => {
    const sections: ConfigSection[] = [
      {
        type: "mcu",
        name: "mcu",
        values: { serial: "/dev/ttyUSB0" },
      },
    ];

    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const mcu = doc.sections.find((s) => s.definitionId === "mcu");
    expect(mcu).toBeDefined();
    expect(mcu?.data.serial).toBe("/dev/ttyUSB0");
    expect(mcu?.meta?._mode).toBe("serial");

    const autoFixed = warnings.filter((w) => w.autoFixed);
    expect(autoFixed).toHaveLength(0);
  });

  it("preserves inactive mode fields in TMC section with both uart and spi", () => {
    const sections: ConfigSection[] = [
      {
        type: "tmc2240",
        name: "tmc2240 stepper_x",
        values: { uart_pin: "PA10", cs_pin: "PA4", run_current: 0.8 },
      },
    ];

    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const tmc = doc.sections.find((s) => s.definitionId === "tmc2240");
    expect(tmc).toBeDefined();
    expect(tmc?.data.uart_pin).toBe("PA10");
    expect(tmc?.data.cs_pin).toBe("PA4");
    expect(tmc?.meta?._mode).toBe("uart");

    const modeWarnings = warnings.filter((w) => !w.autoFixed && w.message.includes("won't be output"));
    expect(modeWarnings).toHaveLength(1);
    expect(modeWarnings[0].message).toContain("cs_pin");
  });

  it("does not modify sections without mode config (mode lint)", () => {
    const sections: ConfigSection[] = [
      {
        type: "printer",
        name: "printer",
        values: { kinematics: "corexy", max_velocity: 300, max_accel: 3000 },
      },
    ];

    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const printer = doc.sections.find((s) => s.definitionId === "printer");
    expect(printer).toBeDefined();
    expect(printer?.data.kinematics).toBe("corexy");
    expect(printer?.meta?._mode).toBeUndefined();

    const autoFixed = warnings.filter((w) => w.autoFixed);
    expect(autoFixed).toHaveLength(0);
  });
});

describe("import lint: visibility conflict warnings", () => {
  const registry = createDefaultRegistry();

  it("warns about PID fields when control is watermark", () => {
    const sections: ConfigSection[] = [
      {
        type: "extruder",
        name: "extruder",
        values: { control: "watermark", pid_kp: 25.0, pid_ki: 1.1, pid_kd: 114.0 },
      },
    ];

    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const extruder = doc.sections.find((s) => s.definitionId === "extruder");
    expect(extruder).toBeDefined();
    // Fields are preserved in data
    expect(extruder?.data.pid_kp).toBe(25.0);
    expect(extruder?.data.pid_ki).toBe(1.1);
    expect(extruder?.data.pid_kd).toBe(114.0);
    expect(extruder?.data.control).toBe("watermark");

    // Warnings emitted for each hidden field
    const visibilityWarnings = warnings.filter((w) => !w.autoFixed && w.message.includes("has no effect"));
    expect(visibilityWarnings.length).toBeGreaterThanOrEqual(3);
    expect(visibilityWarnings.some((w) => w.message.includes("pid_kp"))).toBe(true);
    expect(visibilityWarnings.some((w) => w.message.includes("pid_ki"))).toBe(true);
    expect(visibilityWarnings.some((w) => w.message.includes("pid_kd"))).toBe(true);
  });

  it("does not warn when visibility conditions are met", () => {
    const sections: ConfigSection[] = [
      {
        type: "extruder",
        name: "extruder",
        values: { control: "pid", pid_kp: 25.0, pid_ki: 1.1, pid_kd: 114.0 },
      },
    ];

    const warnings: ImportWarning[] = [];
    cfgToDocument(sections, [], registry, undefined, undefined, warnings);

    const visibilityWarnings = warnings.filter((w) => !w.autoFixed && w.message.includes("has no effect"));
    expect(visibilityWarnings).toHaveLength(0);
  });
});
