import { describe, expect, it } from "vitest";
import { collectActiveOverrides } from "../../sections/overrides";
import { createDefaultRegistry } from "../../sections/schemas";
import type { ConfigDocument } from "../../sections/types";

describe("collectActiveOverrides", () => {
  it("returns empty map when no override-defining sections exist", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: { kinematics: "cartesian", max_velocity: 300, max_accel: 3000 },
        },
        {
          definitionId: "stepper",
          instanceName: "z",
          data: { endstop_pin: "PG10", homing_retract_dist: 5 },
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(0);
  });

  it("returns correct override entries when cartographer and stepper_z are present", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "stepper",
          instanceName: "z",
          data: {
            step_pin: "PF11",
            dir_pin: "PG3",
            enable_pin: "!PG5",
            microsteps: 16,
            rotation_distance: 8,
            endstop_pin: "PG10",
            position_max: 250,
            homing_retract_dist: 5,
          },
        },
        {
          definitionId: "cartographer",
          data: {},
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(1);

    const stepperOverrides = result.get("stepper_z");
    expect(stepperOverrides).toBeDefined();
    expect(stepperOverrides?.size).toBe(2);

    const endstopOverride = stepperOverrides?.get("endstop_pin");
    expect(endstopOverride).toEqual({
      sourceHeader: "cartographer",
      sourceDefinitionId: "cartographer",
      overriddenValue: "probe:z_virtual_endstop",
      originalValue: "PG10",
    });

    const retractOverride = stepperOverrides?.get("homing_retract_dist");
    expect(retractOverride).toEqual({
      sourceHeader: "cartographer",
      sourceDefinitionId: "cartographer",
      overriddenValue: 0,
      originalValue: 5,
    });
  });

  it("returns no entries when target section is missing", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "cartographer",
          data: {},
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(0);
  });

  it("returns SAVE_CONFIG overrides for overlapping fields", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "heater_bed",
          data: {
            heater_pin: "PA1",
            sensor_type: "NTC 100K MGB18-104F39050L32",
            sensor_pin: "PF3",
            control: "pid",
            pid_kp: 50,
            pid_ki: 0.5,
            pid_kd: 900,
            min_temp: 0,
            max_temp: 120,
          },
        },
      ],

      saveConfigSections: [
        {
          type: "heater_bed",
          name: "heater_bed",
          values: { pid_kp: 54.027, pid_ki: 0.77, pid_kd: 948.182 },
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(1);

    const overrides = result.get("heater_bed");
    expect(overrides).toBeDefined();
    expect(overrides?.size).toBe(3);

    expect(overrides?.get("pid_kp")).toEqual({
      sourceHeader: "#*# heater_bed",
      sourceDefinitionId: "save_config",
      overriddenValue: 54.027,
      originalValue: 50,
    });
  });

  it("includes SAVE_CONFIG fields that are valid params but not in section data", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "heater_bed",
          data: {
            heater_pin: "PA1",
            sensor_type: "NTC 100K MGB18-104F39050L32",
            sensor_pin: "PF3",
          },
        },
      ],

      saveConfigSections: [
        {
          type: "heater_bed",
          name: "heater_bed",
          values: { pid_kp: 54.027, pid_ki: 0.77 },
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(1);

    const overrides = result.get("heater_bed");
    expect(overrides).toBeDefined();
    expect(overrides?.size).toBe(2);

    expect(overrides?.get("pid_kp")).toEqual({
      sourceHeader: "#*# heater_bed",
      sourceDefinitionId: "save_config",
      overriddenValue: 54.027,
      originalValue: undefined,
    });

    expect(overrides?.get("pid_ki")).toEqual({
      sourceHeader: "#*# heater_bed",
      sourceDefinitionId: "save_config",
      overriddenValue: 0.77,
      originalValue: undefined,
    });
  });

  it("does not include SAVE_CONFIG fields that are not valid params in the definition", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "heater_bed",
          data: {
            heater_pin: "PA1",
            sensor_type: "NTC 100K MGB18-104F39050L32",
            sensor_pin: "PF3",
          },
        },
      ],

      saveConfigSections: [
        {
          type: "heater_bed",
          name: "heater_bed",
          values: { totally_fake_field: 123 },
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(0);
  });

  it("returns SAVE_CONFIG overrides for named sections", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "tmc2209",
          instanceName: "stepper_x",
          data: { uart_pin: "PC4", run_current: 0.8 },
        },
      ],

      saveConfigSections: [
        {
          type: "tmc2209",
          name: "stepper_x",
          values: { run_current: 1.0 },
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    expect(result.size).toBe(1);

    const overrides = result.get("tmc2209 stepper_x");
    expect(overrides).toBeDefined();
    expect(overrides?.size).toBe(1);

    expect(overrides?.get("run_current")).toEqual({
      sourceHeader: "#*# tmc2209 stepper_x",
      sourceDefinitionId: "save_config",
      overriddenValue: 1.0,
      originalValue: 0.8,
    });
  });

  it("tracks undefined original value when field not set by user", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "stepper",
          instanceName: "z",
          data: {
            step_pin: "PF11",
            dir_pin: "PG3",
            enable_pin: "!PG5",
            microsteps: 16,
            rotation_distance: 8,
            position_max: 250,
          },
        },
        {
          definitionId: "cartographer",
          data: {},
        },
      ],
    };

    const result = collectActiveOverrides(doc, registry);
    const stepperOverrides = result.get("stepper_z");
    expect(stepperOverrides).toBeDefined();

    const endstopOverride = stepperOverrides?.get("endstop_pin");
    expect(endstopOverride?.originalValue).toBeUndefined();

    const retractOverride = stepperOverrides?.get("homing_retract_dist");
    expect(retractOverride?.originalValue).toBeUndefined();
  });
});
