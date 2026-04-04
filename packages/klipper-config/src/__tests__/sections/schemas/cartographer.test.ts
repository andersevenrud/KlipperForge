import { describe, expect, it } from "vitest";
import {
  cartographerCoilDefinition,
  cartographerCoilSchema,
  cartographerDefinition,
  cartographerScanDefinition,
  cartographerScanSchema,
  cartographerSchema,
  cartographerTouchDefinition,
  cartographerTouchSchema,
} from "../../../sections/schemas/cartographer";

describe("cartographerSchema", () => {
  it("accepts valid cartographer data", () => {
    const result = cartographerSchema.safeParse({
      x_offset: 0,
      y_offset: 0,
    });
    expect(result.success).toBe(true);
  });

  it("allows passthrough extras", () => {
    const result = cartographerSchema.safeParse({
      x_offset: 0,
      y_offset: 0,
      canbus_uuid: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("validates z_backlash min", () => {
    expect(cartographerSchema.safeParse({ z_backlash: -1 }).success).toBe(false);
    expect(cartographerSchema.safeParse({ z_backlash: 0 }).success).toBe(true);
    expect(cartographerSchema.safeParse({ z_backlash: 0.1 }).success).toBe(true);
  });

  it("validates travel_speed min", () => {
    expect(cartographerSchema.safeParse({ travel_speed: 0 }).success).toBe(false);
    expect(cartographerSchema.safeParse({ travel_speed: 1 }).success).toBe(true);
  });

  it("validates lift_speed min", () => {
    expect(cartographerSchema.safeParse({ lift_speed: 0 }).success).toBe(false);
    expect(cartographerSchema.safeParse({ lift_speed: 5 }).success).toBe(true);
  });

  it("accepts macro_prefix as string", () => {
    expect(cartographerSchema.safeParse({ macro_prefix: "CARTO_" }).success).toBe(true);
  });
});

describe("cartographerDefinition", () => {
  it("has stepper_z override", () => {
    expect(cartographerDefinition.overrides).toHaveLength(1);
    expect(cartographerDefinition.overrides?.[0].target).toBe("stepper_z");
    expect(cartographerDefinition.overrides?.[0].values.endstop_pin).toBe("probe:z_virtual_endstop");
  });

  it("has correct metadata", () => {
    expect(cartographerDefinition.id).toBe("cartographer");
    expect(cartographerDefinition.naming).toEqual({
      kind: "custom",
      header: "cartographer",
    });
    expect(cartographerDefinition.order).toBe(60);
  });
});

describe("cartographerScanSchema", () => {
  it("accepts valid scan data", () => {
    const result = cartographerScanSchema.safeParse({
      samples: 20,
      probe_speed: 5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty data", () => {
    expect(cartographerScanSchema.safeParse({}).success).toBe(true);
  });

  it("validates mesh_direction choices", () => {
    expect(cartographerScanSchema.safeParse({ mesh_direction: "x" }).success).toBe(true);
    expect(cartographerScanSchema.safeParse({ mesh_direction: "y" }).success).toBe(true);
    expect(cartographerScanSchema.safeParse({ mesh_direction: "z" }).success).toBe(false);
  });

  it("validates mesh_path choices", () => {
    expect(cartographerScanSchema.safeParse({ mesh_path: "snake" }).success).toBe(true);
    expect(cartographerScanSchema.safeParse({ mesh_path: "spiral" }).success).toBe(true);
    expect(cartographerScanSchema.safeParse({ mesh_path: "invalid" }).success).toBe(false);
  });

  it("validates probe_speed min", () => {
    expect(cartographerScanSchema.safeParse({ probe_speed: 0 }).success).toBe(false);
    expect(cartographerScanSchema.safeParse({ probe_speed: 0.1 }).success).toBe(true);
  });

  it("validates mesh_height min", () => {
    expect(cartographerScanSchema.safeParse({ mesh_height: 0.5 }).success).toBe(false);
    expect(cartographerScanSchema.safeParse({ mesh_height: 1 }).success).toBe(true);
  });
});

describe("cartographerScanDefinition", () => {
  it("has correct metadata", () => {
    expect(cartographerScanDefinition.id).toBe("cartographer_scan");
    expect(cartographerScanDefinition.naming).toEqual({
      kind: "fixed",
      header: "cartographer scan",
    });
    expect(cartographerScanDefinition.order).toBe(61);
  });
});

describe("cartographerTouchSchema", () => {
  it("accepts valid touch data", () => {
    const result = cartographerTouchSchema.safeParse({
      samples: 3,
      retract_distance: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty data", () => {
    expect(cartographerTouchSchema.safeParse({}).success).toBe(true);
  });

  it("validates samples min", () => {
    expect(cartographerTouchSchema.safeParse({ samples: 2 }).success).toBe(false);
    expect(cartographerTouchSchema.safeParse({ samples: 3 }).success).toBe(true);
  });

  it("validates sample_range bounds", () => {
    expect(cartographerTouchSchema.safeParse({ sample_range: 0.0005 }).success).toBe(false);
    expect(cartographerTouchSchema.safeParse({ sample_range: 0.001 }).success).toBe(true);
    expect(cartographerTouchSchema.safeParse({ sample_range: 0.015 }).success).toBe(true);
    expect(cartographerTouchSchema.safeParse({ sample_range: 0.02 }).success).toBe(false);
  });

  it("validates retract_distance min", () => {
    expect(cartographerTouchSchema.safeParse({ retract_distance: 0.5 }).success).toBe(false);
    expect(cartographerTouchSchema.safeParse({ retract_distance: 1 }).success).toBe(true);
  });

  it("validates home_random_radius min", () => {
    expect(cartographerTouchSchema.safeParse({ home_random_radius: -1 }).success).toBe(false);
    expect(cartographerTouchSchema.safeParse({ home_random_radius: 0 }).success).toBe(true);
  });

  it("validates max_noisy_samples min", () => {
    expect(cartographerTouchSchema.safeParse({ max_noisy_samples: -1 }).success).toBe(false);
    expect(cartographerTouchSchema.safeParse({ max_noisy_samples: 0 }).success).toBe(true);
  });
});

describe("cartographerTouchDefinition", () => {
  it("has correct metadata", () => {
    expect(cartographerTouchDefinition.id).toBe("cartographer_touch");
    expect(cartographerTouchDefinition.naming).toEqual({
      kind: "fixed",
      header: "cartographer touch",
    });
    expect(cartographerTouchDefinition.order).toBe(61);
  });
});

describe("cartographerCoilSchema", () => {
  it("accepts valid coil data", () => {
    const result = cartographerCoilSchema.safeParse({
      name: "cartographer_coil",
      min_temp: 0,
      max_temp: 105,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty data", () => {
    expect(cartographerCoilSchema.safeParse({}).success).toBe(true);
  });

  it("accepts negative min_temp", () => {
    expect(cartographerCoilSchema.safeParse({ min_temp: -40 }).success).toBe(true);
    expect(cartographerCoilSchema.safeParse({ min_temp: -273.15 }).success).toBe(true);
  });

  it("rejects min_temp below absolute zero", () => {
    expect(cartographerCoilSchema.safeParse({ min_temp: -300 }).success).toBe(false);
  });
});

describe("cartographerCoilDefinition", () => {
  it("has correct metadata", () => {
    expect(cartographerCoilDefinition.id).toBe("cartographer_coil");
    expect(cartographerCoilDefinition.naming).toEqual({
      kind: "fixed",
      header: "cartographer coil",
    });
    expect(cartographerCoilDefinition.order).toBe(61);
  });
});
