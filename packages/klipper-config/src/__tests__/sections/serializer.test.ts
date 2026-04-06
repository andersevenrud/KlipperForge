import { describe, expect, it } from "vitest";
import { SectionRegistry } from "../../sections/registry";
import { createDefaultRegistry } from "../../sections/schemas";
import { serializeConfig, serializeConfigWithSourceMap } from "../../sections/serializer";
import type { ConfigDocument, SectionDefinition } from "../../sections/types";

describe("serializeConfig", () => {
  it("serializes a basic config document", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "corexy",
            max_velocity: 300,
            max_accel: 3000,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[printer]");
    expect(output).toContain("kinematics: corexy");
    expect(output).toContain("max_velocity: 300");
    expect(output).toContain("max_accel: 3000");
  });

  it("preserves section array order", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "fan",
          data: { pin: "PA8" },
        },
        {
          definitionId: "printer",
          data: {
            kinematics: "cartesian",
            max_velocity: 300,
            max_accel: 3000,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    const fanIdx = output.indexOf("[fan]");
    const printerIdx = output.indexOf("[printer]");
    expect(fanIdx).toBeLessThan(printerIdx);
  });

  it("resolves suffixed section headers", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "stepper",
          instanceName: "x",
          data: {
            step_pin: "PF13",
            dir_pin: "PF12",
            enable_pin: "!PF14",
            microsteps: 16,
            rotation_distance: 40,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[stepper_x]");
  });

  it("resolves named section headers", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "heater_fan",
          instanceName: "hotend_fan",
          data: { pin: "PD12" },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[heater_fan hotend_fan]");
  });

  it("excludes meta fields from output", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "stepper",
          instanceName: "x",
          data: {
            _name: "x",
            step_pin: "PF13",
            dir_pin: "PF12",
            enable_pin: "!PF14",
            microsteps: 16,
            rotation_distance: 40,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).not.toContain("_name");
  });

  it("formats boolean values as True/False", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "tmc2209",
          instanceName: "stepper_x",
          data: {
            uart_pin: "PC4",
            interpolate: false,
            run_current: 0.8,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("interpolate: False");
  });

  it("applies overrides from cartographer to stepper_z", () => {
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
            homing_retract_dist: 5,
          },
        },
        {
          definitionId: "cartographer",
          data: { x_offset: 0, y_offset: 0 },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("endstop_pin: probe:z_virtual_endstop");
    expect(output).toContain("homing_retract_dist: 0");
  });

  it("applies overrides from beacon to stepper_z", () => {
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
          },
        },
        {
          definitionId: "beacon",
          data: { x_offset: 0, y_offset: 0 },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("endstop_pin: probe:z_virtual_endstop");
    expect(output).toContain("homing_retract_dist: 0");
  });

  it("serializes gcode_macro as a named section", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "cartesian",
            max_velocity: 300,
            max_accel: 3000,
          },
        },
        {
          definitionId: "gcode_macro",
          instanceName: "PRINT_START",
          data: {
            gcode: "G28\nG90",
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[gcode_macro PRINT_START]");
    expect(output).toContain("gcode:\n    G28\n    G90");
  });

  it("serializes gcode_macro with variable_ keys", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "gcode_macro",
          instanceName: "PRINT_START",
          data: {
            gcode: "G28",
            variable_fan_speed: 75,
            variable_z_offset: 0.5,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[gcode_macro PRINT_START]");
    expect(output).toContain("variable_fan_speed: 75");
    expect(output).toContain("variable_z_offset: 0.5");
    expect(output).toContain("gcode: G28");
  });

  it("handles passthrough (extra) fields", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "cartesian",
            max_velocity: 300,
            max_accel: 3000,
            custom_field: "custom_value",
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("custom_field: custom_value");
  });

  it("preserves inline comments in output", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "stepper",
          instanceName: "x",
          data: {
            step_pin: "PF13",
            dir_pin: "PF12",
            enable_pin: "!PF14",
            microsteps: 16,
            rotation_distance: 40,
          },
          comments: {
            step_pin: "motor0",
            rotation_distance: "distance per revolution",
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("step_pin: PF13 # motor0");
    expect(output).toContain("rotation_distance: 40 # distance per revolution");
    expect(output).toContain("dir_pin: PF12\n");
  });

  it("does not mutate original document sections", () => {
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
          },
        },
        {
          definitionId: "cartographer",
          data: { x_offset: 0, y_offset: 0 },
        },
      ],
    };

    serializeConfig(doc, registry);
    expect(doc.sections[0].data.endstop_pin).toBe("PG10");
  });

  it("emits SAVE_CONFIG sections at the end with #*# prefixes", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "corexy",
            max_velocity: 300,
            max_accel: 3000,
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

    const output = serializeConfig(doc, registry);
    expect(output).toContain("#*# <---------------------- SAVE_CONFIG ---------------------->");
    expect(output).toContain("#*# DO NOT EDIT THIS BLOCK OR BELOW.");
    expect(output).toContain("#*# [heater_bed]");
    expect(output).toContain("#*# pid_kp = 54.027");
    expect(output).toContain("#*# pid_ki = 0.77");
    expect(output).toContain("#*# pid_kd = 948.182");

    // SAVE_CONFIG should be at the end
    const saveIdx = output.indexOf("#*# <");
    const printerIdx = output.indexOf("[printer]");
    expect(saveIdx).toBeGreaterThan(printerIdx);
  });

  it("emits SAVE_CONFIG with multiline values", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [],

      saveConfigSections: [
        {
          type: "bed_mesh",
          name: "default",
          values: {
            version: 1,
            points: "\n0.010000, 0.020000\n0.030000, 0.040000",
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("#*# [bed_mesh default]");
    expect(output).toContain("#*# version = 1");
    expect(output).toContain("#*# points =");
    expect(output).toContain("#*# \t0.010000, 0.020000");
    expect(output).toContain("#*# \t0.030000, 0.040000");
  });

  it("filters MCU fields by auto-detected mode (canbus)", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "mcu",
          data: {
            serial: "/dev/ttyUSB0",
            canbus_uuid: "abc123",
            canbus_interface: "can0",
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("canbus_uuid: abc123");
    expect(output).toContain("canbus_interface: can0");
    expect(output).not.toContain("serial:");
  });

  it("filters MCU fields by explicit mode in meta", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "mcu",
          data: {
            serial: "/dev/ttyUSB0",
            canbus_uuid: "abc123",
          },
          meta: { _mode: "serial" },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("serial: /dev/ttyUSB0");
    expect(output).not.toContain("canbus_uuid:");
  });

  it("filters TMC fields by auto-detected mode (UART)", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "tmc2240",
          instanceName: "stepper_x",
          data: {
            uart_pin: "PA10",
            cs_pin: "PA4",
            run_current: 0.8,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("uart_pin: PA10");
    expect(output).toContain("run_current: 0.8");
    expect(output).not.toContain("cs_pin:");
  });

  it("filters PID fields when control is watermark (dynamically-injected visibility)", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "extruder",
          data: {
            step_pin: "PF13",
            dir_pin: "PF12",
            enable_pin: "!PF14",
            microsteps: 16,
            rotation_distance: 33.5,
            nozzle_diameter: 0.4,
            filament_diameter: 1.75,
            heater_pin: "PA2",
            sensor_type: "EPCOS 100K B57560G104F",
            sensor_pin: "PF4",
            control: "watermark",
            pid_kp: 26.213,
            pid_ki: 1.304,
            pid_kd: 131.721,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry);
    expect(output).toContain("[extruder]");
    expect(output).toContain("control: watermark");
    expect(output).not.toContain("pid_kp");
    expect(output).not.toContain("pid_ki");
    expect(output).not.toContain("pid_kd");
  });

  it("omits fields matching defaults when omitDefaults is true", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "fan",
          data: {
            pin: "PA8",
            max_power: 1, // default is 1
            shutdown_speed: 0, // default is 0
            kick_start_time: 0.5, // default is 0.1 — not a match
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry, { omitDefaults: true });
    expect(output).toContain("pin: PA8");
    expect(output).not.toContain("max_power");
    expect(output).not.toContain("shutdown_speed");
    expect(output).toContain("kick_start_time: 0.5");
  });

  it("includes fields matching defaults when omitDefaults is false", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "fan",
          data: {
            pin: "PA8",
            max_power: 1,
            shutdown_speed: 0,
          },
        },
      ],
    };

    const output = serializeConfig(doc, registry, { omitDefaults: false });
    expect(output).toContain("max_power: 1");
    expect(output).toContain("shutdown_speed: 0");
  });

  it("returns per-field defaultMatches from serializeConfigWithSourceMap", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "fan",
          data: {
            pin: "PA8",
            max_power: 1, // default match
            shutdown_speed: 0, // default match
            kick_start_time: 0.5, // not a match
          },
        },
      ],
    };

    const { defaultMatches } = serializeConfigWithSourceMap(doc, registry, { omitDefaults: true });
    expect(defaultMatches).toHaveLength(2);
    expect(defaultMatches).toContainEqual({ section: "fan", field: "max_power", value: 1 });
    expect(defaultMatches).toContainEqual({ section: "fan", field: "shutdown_speed", value: 0 });
  });

  it("returns defaultMatches even when omitDefaults is false", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "fan",
          data: {
            pin: "PA8",
            max_power: 1,
          },
        },
      ],
    };

    const { defaultMatches } = serializeConfigWithSourceMap(doc, registry, { omitDefaults: false });
    expect(defaultMatches).toHaveLength(1);
    expect(defaultMatches).toContainEqual({ section: "fan", field: "max_power", value: 1 });
  });

  it("tracks source map lines for SAVE_CONFIG sections", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "corexy",
            max_velocity: 300,
            max_accel: 3000,
          },
        },
      ],

      saveConfigSections: [
        {
          type: "heater_bed",
          name: "heater_bed",
          values: { pid_kp: 54.027 },
        },
      ],
    };

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);
    const lines = text.split("\n");

    // Find the #*# [heater_bed] line
    const headerLine = sourceMap.sectionLines.get("#*# heater_bed") ?? 0;
    expect(headerLine).toBeGreaterThan(0);
    expect(lines[headerLine - 1]).toBe("#*# [heater_bed]");

    // Find the pid_kp field line
    const fieldLine = sourceMap.fieldLines.get("#*# heater_bed::pid_kp") ?? 0;
    expect(fieldLine).toBeGreaterThan(0);
    expect(lines[fieldLine - 1]).toBe("#*# pid_kp = 54.027");
  });
});
