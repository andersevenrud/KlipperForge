import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "../../sections/schemas";
import type { ConfigDocument, SectionInstance } from "../../sections/types";
import { validateDocument } from "../../sections/validator";

function findSection(doc: ConfigDocument, definitionId: string, instanceName?: string): SectionInstance {
  const section = doc.sections.find(
    (s) => s.definitionId === definitionId && (instanceName === undefined || s.instanceName === instanceName),
  );
  if (!section) throw new Error(`Section ${definitionId} ${instanceName ?? ""} not found`);
  return section;
}

function makeMinimalDoc(overrides: Partial<ConfigDocument> = {}): ConfigDocument {
  return {
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
        definitionId: "mcu",
        data: { serial: "/dev/serial/by-id/usb-test" },
      },
      {
        definitionId: "stepper",
        instanceName: "x",
        data: {
          step_pin: "PA0",
          dir_pin: "PA1",
          enable_pin: "!PA2",
          microsteps: 16,
          rotation_distance: 40,
          position_endstop: 0,
        },
      },
      {
        definitionId: "stepper",
        instanceName: "y",
        data: {
          step_pin: "PB0",
          dir_pin: "PB1",
          enable_pin: "!PB2",
          microsteps: 16,
          rotation_distance: 40,
          position_endstop: 0,
        },
      },
      {
        definitionId: "stepper",
        instanceName: "z",
        data: {
          step_pin: "PC0",
          dir_pin: "PC1",
          enable_pin: "!PC2",
          microsteps: 16,
          rotation_distance: 8,
          position_endstop: 0,
        },
      },
      {
        definitionId: "extruder",
        data: {
          step_pin: "PD0",
          dir_pin: "PD1",
          enable_pin: "!PD2",
          microsteps: 16,
          rotation_distance: 33.5,
          nozzle_diameter: 0.4,
          filament_diameter: 1.75,
          heater_pin: "PE0",
          sensor_type: "EPCOS 100K B57560G104F",
          sensor_pin: "PE1",
          control: "pid",
          min_temp: 0,
          max_temp: 250,
        },
      },
      ...(overrides.sections ?? []),
    ],
    macros: overrides.macros,
    saveConfigSections: overrides.saveConfigSections,
  };
}

describe("validateDocument", () => {
  it("returns no errors for a valid minimal document", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    const errors = validateDocument(doc, registry);
    const actualErrors = errors.filter((e) => e.severity !== "warning");
    expect(actualErrors).toHaveLength(0);
  });

  it("warns when steppers lack TMC drivers", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    const errors = validateDocument(doc, registry);
    const tmcWarnings = errors.filter((e) => e.severity === "warning" && e.message.includes("No TMC stepper driver"));
    expect(tmcWarnings).toHaveLength(4); // stepper_x, stepper_y, stepper_z, extruder
  });

  it("reports TMC driver referencing non-existent stepper", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "tmc2209",
          instanceName: "stepper_nonexistent",
          data: { uart_pin: "PA3", run_current: 0.8 },
        },
      ],
    });
    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.message.includes("References non-existent section"))).toBe(true);
  });

  it("does not warn when stepper has a matching TMC driver", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "tmc2209",
          instanceName: "stepper_x",
          data: { uart_pin: "PA3", run_current: 0.8 },
        },
      ],
    });
    const errors = validateDocument(doc, registry);
    const xWarnings = errors.filter((e) => e.section === "stepper_x" && e.message.includes("No TMC stepper driver"));
    expect(xWarnings).toHaveLength(0);
  });

  it("reports missing printer section", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "mcu",
          data: { serial: "/dev/test" },
        },
        {
          definitionId: "stepper",
          instanceName: "x",
          data: {
            step_pin: "PA0",
            dir_pin: "PA1",
            enable_pin: "!PA2",
            microsteps: 16,
            rotation_distance: 40,
          },
        },
        {
          definitionId: "stepper",
          instanceName: "y",
          data: {
            step_pin: "PB0",
            dir_pin: "PB1",
            enable_pin: "!PB2",
            microsteps: 16,
            rotation_distance: 40,
          },
        },
        {
          definitionId: "stepper",
          instanceName: "z",
          data: {
            step_pin: "PC0",
            dir_pin: "PC1",
            enable_pin: "!PC2",
            microsteps: 16,
            rotation_distance: 8,
          },
        },
        {
          definitionId: "extruder",
          data: {
            step_pin: "PD0",
            dir_pin: "PD1",
            enable_pin: "!PD2",
            microsteps: 16,
            rotation_distance: 33.5,
            nozzle_diameter: 0.4,
            filament_diameter: 1.75,
            heater_pin: "PE0",
            sensor_type: "EPCOS",
            sensor_pin: "PE1",
            min_temp: 0,
            max_temp: 250,
          },
        },
      ],
    };

    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.section === "printer")).toBe(true);
  });

  it("reports missing mcu section", () => {
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
      ],
    };

    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.section === "mcu")).toBe(true);
  });

  it("reports missing stepper sections", () => {
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
          definitionId: "mcu",
          data: { serial: "/dev/test" },
        },
        {
          definitionId: "extruder",
          data: {
            step_pin: "PD0",
            dir_pin: "PD1",
            enable_pin: "!PD2",
            microsteps: 16,
            rotation_distance: 33.5,
            nozzle_diameter: 0.4,
            filament_diameter: 1.75,
            heater_pin: "PE0",
            sensor_type: "EPCOS",
            sensor_pin: "PE1",
            min_temp: 0,
            max_temp: 250,
          },
        },
      ],
    };

    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.section === "stepper_x")).toBe(true);
    expect(errors.some((e) => e.section === "stepper_y")).toBe(true);
    expect(errors.some((e) => e.section === "stepper_z")).toBe(true);
  });

  it("reports missing position_endstop on stepper_x, stepper_y, stepper_z", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    for (const axis of ["x", "y", "z"] as const) {
      const { position_endstop: _, ...rest } = findSection(doc, "stepper", axis).data;
      findSection(doc, "stepper", axis).data = rest;
    }

    const errors = validateDocument(doc, registry);
    const endstopErrors = errors.filter(
      (e) => e.field === "position_endstop" && e.message.includes("position_endstop is required"),
    );
    expect(endstopErrors).toHaveLength(3);
    expect(endstopErrors.map((e) => e.section).sort()).toEqual(["stepper_x", "stepper_y", "stepper_z"]);
  });

  it("does not require position_endstop when using virtual endstop", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    const stepperZ = findSection(doc, "stepper", "z");
    const { position_endstop: _, ...rest } = stepperZ.data;
    stepperZ.data = { ...rest, endstop_pin: "probe:z_virtual_endstop" };

    const errors = validateDocument(doc, registry);
    const zEndstopErrors = errors.filter((e) => e.section === "stepper_z" && e.field === "position_endstop");
    expect(zEndstopErrors).toHaveLength(0);
  });

  it("does not require position_endstop on non-primary steppers", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "stepper",
          instanceName: "z1",
          data: {
            step_pin: "PF0",
            dir_pin: "PF1",
            enable_pin: "!PF2",
            microsteps: 16,
            rotation_distance: 8,
          },
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const z1EndstopErrors = errors.filter((e) => e.section === "stepper_z1" && e.field === "position_endstop");
    expect(z1EndstopErrors).toHaveLength(0);
  });

  it("reports missing control on extruder", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    const extruder = findSection(doc, "extruder");
    const { control: _, ...rest } = extruder.data;
    extruder.data = rest;

    const errors = validateDocument(doc, registry);
    const controlErrors = errors.filter((e) => e.section === "extruder" && e.field === "control");
    expect(controlErrors).toHaveLength(1);
    expect(controlErrors[0].message).toContain("control is required");
  });

  it("reports missing control on heater_bed", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "heater_bed",
          data: {
            heater_pin: "PF0",
            sensor_type: "NTC 100K MGB18-104F39050L32",
            sensor_pin: "PF1",
            min_temp: 0,
            max_temp: 130,
          },
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const controlErrors = errors.filter((e) => e.section === "heater_bed" && e.field === "control");
    expect(controlErrors).toHaveLength(1);
  });

  it("accepts control from save_config section", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      saveConfigSections: [{ type: "extruder", name: "extruder", values: { control: "pid" } }],
    });
    const extruder = findSection(doc, "extruder");
    const { control: _, ...rest } = extruder.data;
    extruder.data = rest;

    const errors = validateDocument(doc, registry);
    const controlErrors = errors.filter((e) => e.section === "extruder" && e.field === "control");
    expect(controlErrors).toHaveLength(0);
  });

  it("reports schema validation errors", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "cartesian",
            max_velocity: "not a number" as unknown as number,
            max_accel: 3000,
          },
        },
      ],
    };

    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.section === "printer" && e.field)).toBe(true);
  });

  it("detects override conflicts", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "cartographer",
          data: { x_offset: 0, y_offset: 0 },
        },
        {
          definitionId: "beacon",
          data: { x_offset: 0, y_offset: 0 },
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    // Both override stepper_z endstop_pin with the same value, so no conflict
    const conflicts = errors.filter((e) => e.message.includes("Override conflict"));
    expect(conflicts).toHaveLength(0);
  });

  it("detects pin conflicts as warnings", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "fan",
          data: { pin: "PA0" }, // conflicts with stepper_x step_pin
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const pinWarnings = errors.filter((e) => e.severity === "warning" && e.message.includes("PA0"));
    expect(pinWarnings.length).toBeGreaterThanOrEqual(2);
  });

  it("detects pin conflicts through aliases", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "board_pins",
          data: {
            aliases: "MY_FAN=PA0",
          },
        },
        {
          definitionId: "fan",
          data: { pin: "MY_FAN" }, // MY_FAN resolves to PA0, which conflicts with stepper_x step_pin
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const pinWarnings = errors.filter((e) => e.severity === "warning" && e.message.includes("PA0"));
    expect(pinWarnings.length).toBeGreaterThanOrEqual(2);
  });

  it("shows alias and resolved pin in conflict message", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "board_pins",
          data: {
            aliases: "MY_FAN=PA0",
          },
        },
        {
          definitionId: "fan",
          data: { pin: "MY_FAN" },
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const fanWarning = errors.find((e) => e.severity === "warning" && e.section === "fan" && e.field === "pin");
    expect(fanWarning).toBeDefined();
    expect(fanWarning?.message).toContain("MY_FAN");
    expect(fanWarning?.message).toContain("PA0");
  });

  it("reports unknown definition", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "nonexistent_section",
          data: { foo: "bar" },
        },
      ],
    };

    const errors = validateDocument(doc, registry);
    expect(errors.some((e) => e.message.includes("Unknown section definition"))).toBe(true);
  });

  it("warns on unknown pin format (no boards)", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    // Replace stepper_x step_pin with garbage
    findSection(doc, "stepper", "x").data.step_pin = "HELLO";

    const errors = validateDocument(doc, registry);
    const formatWarnings = errors.filter(
      (e) =>
        e.severity === "warning" &&
        e.message.includes("does not match any known pin format") &&
        e.message.includes("HELLO"),
    );
    expect(formatWarnings).toHaveLength(1);
  });

  it("reports error when pin is not on loaded board", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "fan",
          data: { pin: "PF3" },
        },
      ],
    });

    const errors = validateDocument(doc, registry, {
      boards: [
        {
          alias: "",
          mcu: "STM32F446",
          pins: [
            "PA0",
            "PA1",
            "PA2",
            "PB0",
            "PB1",
            "PB2",
            "PC0",
            "PC1",
            "PC2",
            "PD0",
            "PD1",
            "PD2",
            "PE0",
            "PE1",
            "PA8",
          ],
          aliases: {},
        },
      ],
    });

    // PF3 is not in the board pins list
    const boardErrors = errors.filter(
      (e) => e.severity === "error" && e.message.includes("is not available on board") && e.message.includes("PF3"),
    );
    expect(boardErrors).toHaveLength(1);
  });

  it("accepts valid board pins without errors", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();

    // Provide a board with all pins used in the minimal doc
    const errors = validateDocument(doc, registry, {
      boards: [
        {
          alias: "",
          mcu: "STM32F446",
          pins: [
            "PA0",
            "PA1",
            "PA2",
            "PA8",
            "PB0",
            "PB1",
            "PB2",
            "PC0",
            "PC1",
            "PC2",
            "PD0",
            "PD1",
            "PD2",
            "PE0",
            "PE1",
          ],
          aliases: {},
        },
      ],
    });

    const boardErrors = errors.filter((e) => e.severity === "error" && e.message.includes("is not available on board"));
    expect(boardErrors).toHaveLength(0);
  });

  it("accepts board alias pins without errors", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "board_pins",
          data: { aliases: "MY_FAN=PA8" },
        },
        {
          definitionId: "fan",
          data: { pin: "MY_FAN" },
        },
      ],
    });

    // Remove original fan from minimal doc to avoid conflict
    doc.sections = doc.sections.filter((s) => !(s.definitionId === "fan" && s.data.pin === "PA8"));

    const errors = validateDocument(doc, registry, {
      boards: [
        {
          alias: "",
          mcu: "STM32F446",
          pins: [
            "PA0",
            "PA1",
            "PA2",
            "PA8",
            "PB0",
            "PB1",
            "PB2",
            "PC0",
            "PC1",
            "PC2",
            "PD0",
            "PD1",
            "PD2",
            "PE0",
            "PE1",
          ],
          aliases: {},
        },
      ],
    });

    // MY_FAN is a document alias, should not produce format warning
    const formatWarnings = errors.filter((e) => e.severity === "warning" && e.message.includes("MY_FAN"));
    expect(formatWarnings.filter((w) => w.message.includes("does not match"))).toHaveLength(0);
  });

  it("skips validation for reserved pins", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc({
      sections: [
        {
          definitionId: "fan",
          data: { pin: "<GND>" },
        },
      ],
    });

    const errors = validateDocument(doc, registry);
    const gndErrors = errors.filter((e) => e.message.includes("<GND>"));
    expect(gndErrors).toHaveLength(0);
  });

  it("skips validation for virtual endstops", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    findSection(doc, "stepper", "x").data.endstop_pin = "probe:z_virtual_endstop";

    const errors = validateDocument(doc, registry);
    const veErrors = errors.filter((e) => e.message.includes("virtual_endstop"));
    expect(veErrors).toHaveLength(0);
  });

  it("warns when MCU prefix has no matching board", () => {
    const registry = createDefaultRegistry();
    const doc = makeMinimalDoc();
    findSection(doc, "stepper", "x").data.step_pin = "mcu2:PA0";

    const errors = validateDocument(doc, registry, {
      boards: [
        {
          alias: "",
          mcu: "STM32F446",
          pins: ["PA0"],
          aliases: {},
        },
      ],
    });

    const mcuWarnings = errors.filter(
      (e) => e.severity === "warning" && e.message.includes("No board configured for MCU alias"),
    );
    expect(mcuWarnings).toHaveLength(1);
  });

  describe("conditional field warnings (handled by import-lint and serializer, not validator)", () => {
    it("does not warn on visibleWhen conflict: pid_kp with control=watermark", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const extruder = findSection(doc, "extruder");
      extruder.data.control = "watermark";
      extruder.data.pid_kp = 30;

      const errors = validateDocument(doc, registry);
      const pidWarnings = errors.filter(
        (e) => e.section === "extruder" && e.field === "pid_kp" && e.severity === "warning",
      );
      expect(pidWarnings).toHaveLength(0);
    });

    it("does not warn on hiddenWhen conflict: sensor_pin with sensor_type=temperature_combined", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "temperature_sensor",
            instanceName: "test",
            data: {
              sensor_type: "temperature_combined",
              sensor_pin: "PA0",
              sensor_list: "extruder",
              combination_method: "max",
              maximum_deviation: 999,
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const visibilityWarnings = errors.filter(
        (e) =>
          e.section === "temperature_sensor test" &&
          e.field === "sensor_pin" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(visibilityWarnings).toHaveLength(0);
    });

    it("does not warn when visibleWhen condition is satisfied", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const extruder = findSection(doc, "extruder");
      extruder.data.control = "pid";
      extruder.data.pid_kp = 30;

      const errors = validateDocument(doc, registry);
      const pidWarnings = errors.filter(
        (e) =>
          e.section === "extruder" &&
          e.field === "pid_kp" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(pidWarnings).toHaveLength(0);
    });

    it("does not warn when conflicting field is absent", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const extruder = findSection(doc, "extruder");
      extruder.data.control = "watermark";

      const errors = validateDocument(doc, registry);
      const pidWarnings = errors.filter(
        (e) =>
          e.section === "extruder" &&
          e.field === "pid_kp" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(pidWarnings).toHaveLength(0);
    });
  });

  describe("section mode warnings", () => {
    it("does not warn on SPI field in UART mode for tmc2209 (mode-hidden)", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc2209",
            instanceName: "stepper_x",
            data: { uart_pin: "PA3", run_current: 0.8, cs_pin: "PA4" },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const csWarnings = errors.filter(
        (e) =>
          e.section === "tmc2209 stepper_x" &&
          e.field === "cs_pin" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(csWarnings).toHaveLength(0);
    });

    it("does not warn on serial field in canbus mode for mcu (mode-hidden)", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const mcu = findSection(doc, "mcu");
      mcu.data = {
        canbus_uuid: "abc123",
        canbus_interface: "can0",
        serial: "/dev/serial/by-id/usb-test",
      };

      const errors = validateDocument(doc, registry);
      const serialWarnings = errors.filter(
        (e) =>
          e.section === "mcu" &&
          e.field === "serial" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(serialWarnings).toHaveLength(0);
    });

    it("does not warn on canbus fields in serial mode for mcu (mode-hidden)", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const mcu = findSection(doc, "mcu");
      mcu.data = {
        serial: "/dev/serial/by-id/usb-test",
      };
      mcu.data.canbus_interface = "can0";

      const errors = validateDocument(doc, registry);
      const canbusWarnings = errors.filter(
        (e) =>
          e.section === "mcu" &&
          e.field === "canbus_interface" &&
          e.severity === "warning" &&
          e.message.includes("has no effect"),
      );
      expect(canbusWarnings).toHaveLength(0);
    });

    it("does not warn when no conflicting mode fields are set", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc2209",
            instanceName: "stepper_x",
            data: { uart_pin: "PA3", run_current: 0.8 },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const modeWarnings = errors.filter(
        (e) => e.section === "tmc2209 stepper_x" && e.severity === "warning" && e.message.includes("has no effect in"),
      );
      expect(modeWarnings).toHaveLength(0);
    });
  });

  describe("unknown field warnings", () => {
    it("warns on unknown fields in a section", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "temperature_sensor",
            instanceName: "bad_syntax",
            data: {
              sensor_type: "temperature_combined",
              nono: "temperature_combined",
              sensor_list: "extruder",
              combination_method: "max",
              maximum_deviation: 999,
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const unknownWarnings = errors.filter(
        (e) =>
          e.section === "temperature_sensor bad_syntax" &&
          e.field === "nono" &&
          e.severity === "warning" &&
          e.message.includes("Unknown option"),
      );
      expect(unknownWarnings).toHaveLength(1);
    });

    it("does not warn on known fields", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();

      const errors = validateDocument(doc, registry);
      const unknownWarnings = errors.filter((e) => e.severity === "warning" && e.message.includes("Unknown option"));
      expect(unknownWarnings).toHaveLength(0);
    });
  });

  describe("shared bus pin conflict suppression", () => {
    it("does not warn when TMC5160 sections share SPI software pins", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc5160",
            instanceName: "stepper_x",
            data: {
              cs_pin: "PA4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
          {
            definitionId: "tmc5160",
            instanceName: "stepper_y",
            data: {
              cs_pin: "PB3",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const spiConflicts = errors.filter(
        (e) =>
          e.severity === "warning" &&
          e.message.includes("is also used in") &&
          (e.message.includes("PA5") || e.message.includes("PA6") || e.message.includes("PA7")),
      );
      expect(spiConflicts).toHaveLength(0);
    });

    it("warns when SPI software pin is also used as a non-bus field", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc5160",
            instanceName: "stepper_x",
            data: {
              cs_pin: "PA4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
          {
            definitionId: "fan",
            data: { pin: "PA7" }, // PA7 used as fan pin conflicts with spi_software_miso_pin
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const pa7Conflicts = errors.filter(
        (e) => e.severity === "warning" && e.message.includes("is also used in") && e.message.includes("PA7"),
      );
      expect(pa7Conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it("does not warn when TMC5160 and adxl345 share SPI software pins", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc5160",
            instanceName: "stepper_x",
            data: {
              cs_pin: "PA4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
          {
            definitionId: "adxl345",
            data: {
              cs_pin: "PB4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const spiConflicts = errors.filter(
        (e) =>
          e.severity === "warning" &&
          e.message.includes("is also used in") &&
          (e.message.includes("PA5") || e.message.includes("PA6") || e.message.includes("PA7")),
      );
      expect(spiConflicts).toHaveLength(0);
    });

    it("does not warn when I2C sections share I2C software pins", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "pca9533",
            instanceName: "leds",
            data: {
              i2c_software_scl_pin: "PB6",
              i2c_software_sda_pin: "PB7",
              i2c_address: 98,
            },
          },
          {
            definitionId: "probe_eddy_current",
            data: {
              sensor_type: "ldc1612",
              i2c_software_scl_pin: "PB6",
              i2c_software_sda_pin: "PB7",
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const i2cConflicts = errors.filter(
        (e) =>
          e.severity === "warning" &&
          e.message.includes("is also used in") &&
          (e.message.includes("PB6") || e.message.includes("PB7")),
      );
      expect(i2cConflicts).toHaveLength(0);
    });

    it("warns when SPI bus pin conflicts with non-bus field across section types", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "adxl345",
            data: {
              cs_pin: "PB4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
            },
          },
          {
            definitionId: "fan",
            data: { pin: "PA7" }, // fan pin conflicts with adxl345 spi_software_miso_pin
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const pa7Conflicts = errors.filter(
        (e) => e.severity === "warning" && e.message.includes("is also used in") && e.message.includes("PA7"),
      );
      expect(pa7Conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it("does not warn when TMC2209 sections share uart_pin and tx_pin", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc2209",
            instanceName: "stepper_x",
            data: { uart_pin: "PC11", tx_pin: "PC10", uart_address: 0, run_current: 0.58 },
          },
          {
            definitionId: "tmc2209",
            instanceName: "stepper_y",
            data: { uart_pin: "PC11", tx_pin: "PC10", uart_address: 2, run_current: 0.58 },
          },
          {
            definitionId: "tmc2209",
            instanceName: "stepper_z",
            data: { uart_pin: "PC11", tx_pin: "PC10", uart_address: 1, run_current: 0.58 },
          },
          {
            definitionId: "tmc2209",
            instanceName: "extruder",
            data: { uart_pin: "PC11", tx_pin: "PC10", uart_address: 3, run_current: 0.65 },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const uartConflicts = errors.filter(
        (e) =>
          e.severity === "warning" &&
          e.message.includes("is also used in") &&
          (e.message.includes("PC11") || e.message.includes("PC10")),
      );
      expect(uartConflicts).toHaveLength(0);
    });

    it("warns when TMC2209 uart_pin conflicts with a non-bus field", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc2209",
            instanceName: "stepper_x",
            data: { uart_pin: "PC11", tx_pin: "PC10", uart_address: 0, run_current: 0.58 },
          },
          {
            definitionId: "fan",
            data: { pin: "PC11" }, // fan pin clashes with shared TMC uart_pin
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const pc11Conflicts = errors.filter(
        (e) => e.severity === "warning" && e.message.includes("is also used in") && e.message.includes("PC11"),
      );
      expect(pc11Conflicts.length).toBeGreaterThanOrEqual(2);
    });

    it("warns when TMC5160 sections share the same cs_pin", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "tmc5160",
            instanceName: "stepper_x",
            data: {
              cs_pin: "PA4",
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
          {
            definitionId: "tmc5160",
            instanceName: "stepper_y",
            data: {
              cs_pin: "PA4", // same cs_pin — should warn
              spi_software_sclk_pin: "PA5",
              spi_software_mosi_pin: "PA6",
              spi_software_miso_pin: "PA7",
              run_current: 0.8,
            },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const csConflicts = errors.filter(
        (e) => e.severity === "warning" && e.message.includes("is also used in") && e.message.includes("PA4"),
      );
      expect(csConflicts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("duplicate section detection", () => {
    it("reports duplicate section headers", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "fan",
            data: { pin: "PG0" },
          },
          {
            definitionId: "fan",
            data: { pin: "PG1" },
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const dupErrors = errors.filter((e) => e.severity === "error" && e.message.includes("Duplicate section"));
      expect(dupErrors).toHaveLength(1);
      expect(dupErrors[0].message).toContain("[fan]");
      expect(dupErrors[0].message).toContain("2 times");
    });

    it("includes file names in duplicate error when multi-file", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "fan",
            data: { pin: "PG0" },
            file: "printer.cfg",
          },
          {
            definitionId: "fan",
            data: { pin: "PG1" },
            file: "extras.cfg",
          },
        ],
      });
      doc.files = ["printer.cfg", "extras.cfg"];

      const errors = validateDocument(doc, registry);
      const dupErrors = errors.filter((e) => e.severity === "error" && e.message.includes("Duplicate section"));
      expect(dupErrors).toHaveLength(1);
      expect(dupErrors[0].message).toContain("printer.cfg");
      expect(dupErrors[0].message).toContain("extras.cfg");
    });

    it("defaults to primary file when section has no file property", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "fan",
            data: { pin: "PG0" },
          },
          {
            definitionId: "fan",
            data: { pin: "PG1" },
            file: "extras.cfg",
          },
        ],
      });
      doc.files = ["printer.cfg", "extras.cfg"];

      const errors = validateDocument(doc, registry);
      const dupErrors = errors.filter((e) => e.severity === "error" && e.message.includes("Duplicate section"));
      expect(dupErrors).toHaveLength(1);
      expect(dupErrors[0].message).toContain("printer.cfg");
      expect(dupErrors[0].message).toContain("extras.cfg");
    });

    it("does not report duplicates for disabled sections", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc({
        sections: [
          {
            definitionId: "fan",
            data: { pin: "PG0" },
          },
          {
            definitionId: "fan",
            data: { pin: "PG1" },
            disabled: true,
          },
        ],
      });

      const errors = validateDocument(doc, registry);
      const dupErrors = errors.filter((e) => e.severity === "error" && e.message.includes("Duplicate section"));
      expect(dupErrors).toHaveLength(0);
    });
  });

  describe("schema-from-params no longer rejects conditional conflicts", () => {
    it("schema validation does not error on pid_kp with control=watermark", () => {
      const registry = createDefaultRegistry();
      const doc = makeMinimalDoc();
      const extruder = findSection(doc, "extruder");
      extruder.data.control = "watermark";
      extruder.data.pid_kp = 30;

      const errors = validateDocument(doc, registry);
      // Should not have schema errors (severity undefined = error) on pid_kp
      const schemaErrors = errors.filter(
        (e) => e.section === "extruder" && e.field === "pid_kp" && e.severity !== "warning",
      );
      expect(schemaErrors).toHaveLength(0);
    });
  });
});
