import { describe, expect, it } from "vitest";
import { cfgToDocument } from "../import.js";
import { COMMENT_SECTION_TYPE, parseKlipperConfig } from "../parser.js";
import { createDefaultRegistry } from "../sections/schemas/index.js";
import { serializeConfig } from "../sections/serializer.js";
import type { ImportWarning } from "../sections/types.js";

describe("parseKlipperConfig", () => {
  it("parses a simple section", () => {
    const input = `[printer]
kinematics: corexy
max_velocity: 300
max_accel: 3000`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("printer");
    expect(result[0].name).toBe("printer");
    expect(result[0].values.kinematics).toBe("corexy");
    expect(result[0].values.max_velocity).toBe(300);
  });

  it("parses multiple sections", () => {
    const input = `[printer]
kinematics: cartesian

[stepper_x]
step_pin: PF13
rotation_distance: 40`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("printer");
    expect(result[1].type).toBe("stepper_x");
  });

  it("handles named sections", () => {
    const input = `[heater_fan hotend_fan]
pin: PA8`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("heater_fan");
    expect(result[0].name).toBe("hotend_fan");
  });

  it("preserves comments as comment sections", () => {
    const input = `# This is a comment
[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("__comment__");
    expect(result[0].rawText).toBe("# This is a comment");
    expect(result[1].values.kinematics).toBe("corexy");
  });

  it("parses boolean values", () => {
    const input = `[some_section]
enabled: true
disabled: false`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.enabled).toBe(true);
    expect(result[0].values.disabled).toBe(false);
  });

  it("parses case-insensitive boolean values", () => {
    const input = `[some_section]
a: True
b: False
c: TRUE
d: FALSE`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.a).toBe(true);
    expect(result[0].values.b).toBe(false);
    expect(result[0].values.c).toBe(true);
    expect(result[0].values.d).toBe(false);
  });

  it("keeps comma-separated values as strings", () => {
    const input = `[bed_mesh]
mesh_min: 195,0
mesh_max: 25, 0
probe_count: 123 , 456`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.mesh_min).toBe("195,0");
    expect(result[0].values.mesh_max).toBe("25, 0");
    expect(result[0].values.probe_count).toBe("123 , 456");
  });

  it("parses plain numbers correctly", () => {
    const input = `[printer]
max_velocity: 300
step_distance: 0.4
offset: -3`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.max_velocity).toBe(300);
    expect(result[0].values.step_distance).toBe(0.4);
    expect(result[0].values.offset).toBe(-3);
  });

  it("parses inline comments", () => {
    const input = `[stepper_x]
step_pin: PF13 # motor0
dir_pin: PF12
rotation_distance: 40 # distance per revolution`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.step_pin).toBe("PF13");
    expect(result[0].comments?.step_pin).toBe("motor0");
    expect(result[0].comments?.dir_pin).toBeUndefined();
    expect(result[0].values.rotation_distance).toBe(40);
    expect(result[0].comments?.rotation_distance).toBe("distance per revolution");
  });

  it("parses SAVE_CONFIG block", () => {
    const input = `[printer]
kinematics: corexy

#*# <---------------------- SAVE_CONFIG ---------------------->
#*# DO NOT EDIT THIS BLOCK OR BELOW. The contents are auto-generated.
#*#
#*# [heater_bed]
#*# pid_Kp = 54.027
#*# pid_Ki = 0.770
#*# pid_Kd = 948.182
#*#`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].type).toBe("printer");
    expect(result.saveConfigSections).toHaveLength(1);
    expect(result.saveConfigSections?.[0].type).toBe("heater_bed");
    expect(result.saveConfigSections?.[0].name).toBe("heater_bed");
    expect(result.saveConfigSections?.[0].values.pid_kp).toBe(54.027);
    expect(result.saveConfigSections?.[0].values.pid_ki).toBe(0.77);
    expect(result.saveConfigSections?.[0].values.pid_kd).toBe(948.182);
  });

  it("parses SAVE_CONFIG sections with profile names", () => {
    const input = `#*# <---------------------- SAVE_CONFIG ---------------------->
#*#
#*# [bed_mesh default]
#*# version = 1
#*# points =
#*# 	0.010000, 0.020000
#*# 	0.030000, 0.040000
#*#`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.saveConfigSections).toHaveLength(1);
    expect(result.saveConfigSections?.[0].type).toBe("bed_mesh");
    expect(result.saveConfigSections?.[0].name).toBe("default");
    expect(result.saveConfigSections?.[0].values.version).toBe(1);
    expect(result.saveConfigSections?.[0].values.points).toBe("\n0.010000, 0.020000\n0.030000, 0.040000");
  });

  it("parses SAVE_CONFIG with multiline continuation values", () => {
    const input = `#*# <---------------------- SAVE_CONFIG ---------------------->
#*#
#*# [bed_mesh default]
#*# points =
#*# 	1.0, 2.0, 3.0
#*# 	4.0, 5.0, 6.0
#*# 	7.0, 8.0, 9.0
#*#`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.saveConfigSections?.[0].values.points).toBe("\n1.0, 2.0, 3.0\n4.0, 5.0, 6.0\n7.0, 8.0, 9.0");
  });

  it("does not return saveConfigSections in non-extended mode", () => {
    const input = `[printer]
kinematics: corexy

#*# <---------------------- SAVE_CONFIG ---------------------->
#*#
#*# [heater_bed]
#*# pid_Kp = 54.027
#*#`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("printer");
  });

  it("regular sections before SAVE_CONFIG are unaffected", () => {
    const input = `[printer]
kinematics: corexy
max_velocity: 300

[extruder]
step_pin: PE2

#*# <---------------------- SAVE_CONFIG ---------------------->
#*#
#*# [extruder]
#*# pid_Kp = 26.213
#*#`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].type).toBe("printer");
    expect(result.sections[1].type).toBe("extruder");
    expect(result.saveConfigSections).toHaveLength(1);
    expect(result.saveConfigSections?.[0].values.pid_kp).toBe(26.213);
  });

  it("normalizes option keys to lowercase", () => {
    const input = `[extruder]
pid_Kp: 26.213
pid_Ki: 1.304
pid_Kd: 131.721`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.pid_kp).toBe(26.213);
    expect(result[0].values.pid_ki).toBe(1.304);
    expect(result[0].values.pid_kd).toBe(131.721);
    expect(result[0].values.pid_Kp).toBeUndefined();
  });

  it("normalizes SAVE_CONFIG option keys to lowercase", () => {
    const input = `#*# <---------------------- SAVE_CONFIG ---------------------->
#*#
#*# [heater_bed]
#*# pid_Kp = 54.027
#*# pid_Ki = 0.770
#*# pid_Kd = 948.182
#*#`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.saveConfigSections?.[0].values.pid_kp).toBe(54.027);
    expect(result.saveConfigSections?.[0].values.pid_ki).toBe(0.77);
    expect(result.saveConfigSections?.[0].values.pid_kd).toBe(948.182);
    expect(result.saveConfigSections?.[0].values.pid_Kp).toBeUndefined();
  });

  it("parses multiline continuation lines", () => {
    const input = `[gcode_macro PRINT_START]
gcode:
    G28
    G90
    G1 Z5 F3000`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("gcode_macro");
    expect(result[0].name).toBe("PRINT_START");
    expect(result[0].values.gcode).toBe("G28\nG90\nG1 Z5 F3000");
  });

  it("handles multiline gcode with empty key value", () => {
    const input = `[gcode_macro TEST]
gcode:
    M104 S200
description: test macro`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].values.gcode).toBe("M104 S200");
    expect(result[0].values.description).toBe("test macro");
  });

  it("parses gcode_macro with variable_ keys", () => {
    const input = `[gcode_macro PRINT_START]
variable_fan_speed: 75
variable_z_offset: 0.5
gcode:
    G28`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("gcode_macro");
    expect(result[0].name).toBe("PRINT_START");
    expect(result[0].values.variable_fan_speed).toBe(75);
    expect(result[0].values.variable_z_offset).toBe(0.5);
    expect(result[0].values.gcode).toBe("G28");
  });

  it("preserves comment lines within continuations", () => {
    const input = `[gcode_macro TEST]
gcode:
    # This is a comment
    G28`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.gcode).toBe("# This is a comment\nG28");
  });

  it("parses gcode_macro with rename_existing and multiline gcode", () => {
    const input = `[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
    TURN_OFF_HEATERS
    G91
    G1 Z10 F600`;
    const result = parseKlipperConfig(input);
    expect(result[0].values.rename_existing).toBe("BASE_CANCEL_PRINT");
    expect(result[0].values.gcode).toBe("TURN_OFF_HEATERS\nG91\nG1 Z10 F600");
  });

  it("parses board-aliases annotation from header block", () => {
    const input = `# klipperforge:[board_pins]:board-aliases:btt-octopus-pro-1.1

[board_pins]
aliases:
    FAN0=PA8, FAN1=PE5`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("board_pins");
    expect(result[0].annotation).toBe("board-aliases:btt-octopus-pro-1.1");
  });

  it("parses board-aliases annotation on named board_pins from header block", () => {
    const input = `# klipperforge:[board_pins mcu2]:board-aliases:btt-octopus-pro-1.1

[board_pins mcu2]
mcu: mcu2
aliases:
    FAN0=PA8`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("board_pins");
    expect(result[0].name).toBe("mcu2");
    expect(result[0].annotation).toBe("board-aliases:btt-octopus-pro-1.1");
  });

  it("parses mcu board annotation from header block", () => {
    const input = `# klipperforge:[mcu]:btt-octopus-pro-1.1

[mcu]
serial: /dev/serial/by-id/test`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections[0].annotation).toBe("btt-octopus-pro-1.1");
    expect(result.mcuBoards).toHaveLength(1);
    expect(result.mcuBoards[0].boardId).toBe("btt-octopus-pro-1.1");
  });

  it("parses legacy inline board-aliases annotation (backward compat)", () => {
    const input = `[board_pins] # klipperforge:board-aliases:btt-octopus-pro-1.1
aliases:
    FAN0=PA8, FAN1=PE5`;
    const result = parseKlipperConfig(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("board_pins");
    expect(result[0].annotation).toBe("board-aliases:btt-octopus-pro-1.1");
  });

  it("parses legacy inline mcu annotation (backward compat)", () => {
    const input = `[mcu] # klipperforge:btt-octopus-pro-1.1
serial: /dev/serial/by-id/test`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections[0].annotation).toBe("btt-octopus-pro-1.1");
    expect(result.mcuBoards).toHaveLength(1);
    expect(result.mcuBoards[0].boardId).toBe("btt-octopus-pro-1.1");
  });
});

describe("parse warnings", () => {
  it("produces warnings for dropped lines inside a section", () => {
    const input = `[printer]
kinematics: corexy
this is garbage
max_velocity: 300`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings?.[0].line).toBe(3);
    expect(result.warnings?.[0].raw).toBe("this is garbage");
    expect(result.warnings?.[0].message).toContain("Unrecognized line");
  });

  it("gives a specific hint for lines starting with backslash", () => {
    const input = `[printer]
kinematics: corexy
\\continuation_attempt`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings?.[0].message).toContain("malformed continuation");
  });

  it("drops lone backslash values with warning", () => {
    const input = `[printer]
kinematics: \\`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings?.[0].message).toContain("lone backslash");
    expect(result.sections[0].values.kinematics).toBeUndefined();
  });

  it("produces warnings for lines outside any section", () => {
    const input = `orphan_line: value
[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings?.[0].line).toBe(1);
    expect(result.warnings?.[0].message).toContain("outside any section");
  });

  it("produces no warnings for valid configs", () => {
    const input = `# comment
[printer]
kinematics: corexy
max_velocity: 300

[stepper_x]
step_pin: PF13`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.warnings).toBeUndefined();
  });

  it("preserves empty string values at parse level", () => {
    const input = "[section]\nkey:\nother: value";
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections[0].values.key).toBe("");
    expect(result.sections[0].values.other).toBe("value");
    expect(result.warnings).toBeUndefined();
  });

  it("drops empty string values during import but preserves multiline fields", () => {
    const registry = createDefaultRegistry();

    // Non-multiline empty value should be dropped
    const input = "[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\nsquare_corner_velocity:";
    const result = parseKlipperConfig(input, { extended: true });
    const warnings: ImportWarning[] = [];
    const doc = cfgToDocument(result.sections, result.mcuBoards, registry, undefined, undefined, warnings);
    expect(doc.sections[0].data.square_corner_velocity).toBeUndefined();
    expect(warnings.some((w) => w.message.includes("Empty value"))).toBe(true);

    // Multiline empty value (gcode in gcode_macro) should be preserved
    const macroInput = "[gcode_macro TEST]\ngcode:";
    const macroResult = parseKlipperConfig(macroInput, { extended: true });
    const macroWarnings: ImportWarning[] = [];
    const macroDoc = cfgToDocument(
      macroResult.sections,
      macroResult.mcuBoards,
      registry,
      undefined,
      undefined,
      macroWarnings,
    );
    expect(macroDoc.sections[0].data.gcode).toBe("");
    expect(macroWarnings.some((w) => w.message.includes("gcode"))).toBe(false);
  });

  it("detects unknown fields during import via cfgToDocument", () => {
    const input = `[printer]
kinematics: corexy
max_velocity: 300
bogus_field: 42`;
    const result = parseKlipperConfig(input, { extended: true });
    const registry = createDefaultRegistry();
    const warnings: ImportWarning[] = [];
    cfgToDocument(result.sections, result.mcuBoards, registry, result.saveConfigSections, result.presetId, warnings);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w) => w.message.includes("bogus_field"))).toBe(true);
    expect(warnings.some((w) => w.message.includes("Unknown option"))).toBe(true);
  });
});

describe("comment sections", () => {
  it("extracts a comment block before a section", () => {
    const input = `# This is a comment
[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input, { extended: true });
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].type).toBe(COMMENT_SECTION_TYPE);
    expect(result.sections[0].rawText).toBe("# This is a comment");
    expect(result.sections[1].type).toBe("printer");
  });

  it("extracts comment blocks between sections", () => {
    const input = `[printer]
kinematics: corexy

# Motion settings

[stepper_x]
step_pin: PF13`;
    const result = parseKlipperConfig(input, { extended: true });
    const comments = result.sections.filter((s) => s.type === COMMENT_SECTION_TYPE);
    expect(comments).toHaveLength(1);
    expect(comments[0].rawText).toBe("# Motion settings");
    // Order: [printer], comment, [stepper_x]
    expect(result.sections[0].type).toBe("printer");
    expect(result.sections[1].type).toBe(COMMENT_SECTION_TYPE);
    expect(result.sections[2].type).toBe("stepper_x");
  });

  it("splits comment blocks at blank lines", () => {
    const input = `; File header
; Description

# #### SECTION #### #
# Title
# #### SECTION #### #

[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input, { extended: true });
    const comments = result.sections.filter((s) => s.type === COMMENT_SECTION_TYPE);
    expect(comments).toHaveLength(2);
    // First block: preamble (semicolons normalized to #)
    expect(comments[0].rawText).toBe("# File header\n# Description");
    // Second block: section divider
    expect(comments[1].rawText).toBe("# #### SECTION #### #\n# Title\n# #### SECTION #### #");
  });

  it("normalizes semicolon comments to hash", () => {
    const input = `; semicolon comment
; another line
[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input, { extended: true });
    const comment = result.sections[0];
    expect(comment.rawText).toBe("# semicolon comment\n# another line");
  });

  it("assigns unique instance names to comment sections", () => {
    const input = `# First block

# Second block

[printer]
kinematics: corexy

# Third block

[stepper_x]
step_pin: PF13`;
    const result = parseKlipperConfig(input, { extended: true });
    const comments = result.sections.filter((s) => s.type === COMMENT_SECTION_TYPE);
    expect(comments).toHaveLength(3);
    const names = comments.map((c) => c.name);
    expect(new Set(names).size).toBe(3);
  });

  it("preserves comment sections through import round-trip", () => {
    const registry = createDefaultRegistry();
    const input = `# Preamble

# #### MOTION ####

[printer]
kinematics: corexy
max_velocity: 300
max_accel: 3000

# #### STEPPERS ####

[stepper_x]
step_pin: PF13
dir_pin: PF12
enable_pin: !PF14
microsteps: 16
rotation_distance: 40`;
    const result = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(result.sections, result.mcuBoards, registry);
    const commentSections = doc.sections.filter((s) => s.definitionId === COMMENT_SECTION_TYPE);
    expect(commentSections).toHaveLength(3);

    // Verify order: comment(preamble), comment(motion), printer, comment(steppers), stepper
    expect(doc.sections[0].definitionId).toBe(COMMENT_SECTION_TYPE);
    expect(doc.sections[0].rawText).toBe("# Preamble");
    expect(doc.sections[1].definitionId).toBe(COMMENT_SECTION_TYPE);
    expect(doc.sections[1].rawText).toBe("# #### MOTION ####");
    expect(doc.sections[2].definitionId).toBe("printer");
    expect(doc.sections[3].definitionId).toBe(COMMENT_SECTION_TYPE);
    expect(doc.sections[3].rawText).toBe("# #### STEPPERS ####");
    expect(doc.sections[4].definitionId).toBe("stepper");
  });

  it("serializes comment sections in correct position", () => {
    const registry = createDefaultRegistry();
    const input = `# Header comment

[printer]
kinematics: corexy
max_velocity: 300
max_accel: 3000

# Stepper section

[stepper_x]
step_pin: PF13
dir_pin: PF12
enable_pin: !PF14
microsteps: 16
rotation_distance: 40`;
    const result = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(result.sections, result.mcuBoards, registry);
    const output = serializeConfig(doc, registry);
    const lines = output.split("\n");

    // Comment blocks should appear before their respective sections
    const headerIdx = lines.findIndex((l) => l === "# Header comment");
    const printerIdx = lines.findIndex((l) => l === "[printer]");
    const stepperCommentIdx = lines.findIndex((l) => l === "# Stepper section");
    const stepperIdx = lines.findIndex((l) => l === "[stepper_x]");

    expect(headerIdx).toBeGreaterThanOrEqual(0);
    expect(printerIdx).toBeGreaterThan(headerIdx);
    expect(stepperCommentIdx).toBeGreaterThan(printerIdx);
    expect(stepperIdx).toBeGreaterThan(stepperCommentIdx);
  });

  it("does not create comment sections from klipperforge annotations", () => {
    const input = `# klipperforge:printer:my-preset
# klipperforge:[mcu]:btt-octopus-pro-1.1
[printer]
kinematics: corexy`;
    const result = parseKlipperConfig(input, { extended: true });
    const comments = result.sections.filter((s) => s.type === COMMENT_SECTION_TYPE);
    expect(comments).toHaveLength(0);
    expect(result.presetId).toBe("my-preset");
  });

  it("extracts trailing comments after last section", () => {
    const input = `[printer]
kinematics: corexy

# Trailing note`;
    const result = parseKlipperConfig(input, { extended: true });
    const comments = result.sections.filter((s) => s.type === COMMENT_SECTION_TYPE);
    expect(comments).toHaveLength(1);
    expect(comments[0].rawText).toBe("# Trailing note");
    // Order: [printer], comment
    expect(result.sections[0].type).toBe("printer");
    expect(result.sections[1].type).toBe(COMMENT_SECTION_TYPE);
  });
});
