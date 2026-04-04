import { describe, expect, it } from "vitest";
import { printerSchema } from "../../../sections/schemas/printer";

describe("printerSchema", () => {
  it("accepts valid printer data", () => {
    const result = printerSchema.safeParse({
      kinematics: "corexy",
      max_velocity: 300,
      max_accel: 3000,
      max_z_velocity: 15,
      max_z_accel: 350,
      square_corner_velocity: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = printerSchema.safeParse({
      kinematics: "cartesian",
    });
    expect(result.success).toBe(false);
  });

  it("allows passthrough extras", () => {
    const result = printerSchema.safeParse({
      kinematics: "cartesian",
      max_velocity: 300,
      max_accel: 3000,
      custom_option: "value",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.custom_option).toBe("value");
    }
  });
});
