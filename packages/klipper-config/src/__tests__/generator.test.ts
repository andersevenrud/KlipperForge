import { describe, expect, it } from "vitest";
import { generateKlipperConfig } from "../generator.js";
import type { PrinterConfig } from "../types.js";

describe("generateKlipperConfig", () => {
  it("generates a basic config", () => {
    const config: Partial<PrinterConfig> = {
      printer: {
        kinematics: "corexy",
        max_velocity: 300,
        max_accel: 3000,
      },
    };
    const output = generateKlipperConfig(config);
    expect(output).toContain("[printer]");
    expect(output).toContain("kinematics: corexy");
    expect(output).toContain("max_velocity: 300");
  });

  it("generates multiple sections", () => {
    const config: Partial<PrinterConfig> = {
      printer: {
        kinematics: "cartesian",
        max_velocity: 200,
        max_accel: 2000,
      },
      mcu: {
        serial: "/dev/ttyUSB0",
      },
    };
    const output = generateKlipperConfig(config);
    expect(output).toContain("[printer]");
    expect(output).toContain("[mcu]");
    expect(output).toContain("serial: /dev/ttyUSB0");
  });

  it("skips undefined values", () => {
    const config: Partial<PrinterConfig> = {
      printer: {
        kinematics: "corexy",
        max_velocity: 300,
        max_accel: 3000,
        max_z_velocity: undefined,
      },
    };
    const output = generateKlipperConfig(config);
    expect(output).not.toContain("max_z_velocity");
  });
});
