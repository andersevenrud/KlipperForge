import { generateKlipperConfig } from "@klipperforge/klipper-config";
import { describe, expect, it } from "vitest";

describe("App", () => {
  it("generates config with default printer section", () => {
    const config = {
      printer: {
        kinematics: "cartesian" as const,
        max_velocity: 300,
        max_accel: 3000,
      },
    };
    const output = generateKlipperConfig(config);
    expect(output).toContain("[printer]");
    expect(output).toContain("kinematics: cartesian");
  });
});
