import { describe, expect, it } from "vitest";
import { stepperSchema } from "../../../sections/schemas/stepper";

describe("stepperSchema", () => {
  it("accepts valid stepper data", () => {
    const result = stepperSchema.safeParse({
      step_pin: "PF13",
      dir_pin: "PF12",
      enable_pin: "!PF14",
      microsteps: 32,
      rotation_distance: 40,
      endstop_pin: "PG6",
      position_max: 350,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = stepperSchema.safeParse({
      step_pin: "PF13",
      microsteps: 32,
    });
    expect(result.success).toBe(false);
  });

  it("accepts meta field _name", () => {
    const result = stepperSchema.safeParse({
      _name: "x",
      step_pin: "PF13",
      dir_pin: "PF12",
      enable_pin: "!PF14",
      microsteps: 16,
      rotation_distance: 40,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data._name).toBe("x");
    }
  });
});
