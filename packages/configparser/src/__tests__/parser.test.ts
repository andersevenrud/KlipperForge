import { describe, expect, it } from "vitest";
import { parseIni } from "../parser";

describe("parseIni", () => {
  it("parses a simple section", () => {
    const result = parseIni("[printer]\nkinematics: corexy\nmax_velocity: 300");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].type).toBe("printer");
    expect(result.sections[0].name).toBe("printer");
    expect(result.sections[0].values.kinematics).toBe("corexy");
    expect(result.sections[0].values.max_velocity).toBe(300);
  });

  it("parses multiple sections", () => {
    const result = parseIni("[printer]\nkinematics: cartesian\n\n[stepper_x]\nstep_pin: PF13");
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].type).toBe("printer");
    expect(result.sections[1].type).toBe("stepper_x");
  });

  it("handles named sections", () => {
    const result = parseIni("[heater_fan hotend_fan]\npin: PA8");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].type).toBe("heater_fan");
    expect(result.sections[0].name).toBe("hotend_fan");
  });

  it("skips comments and empty lines", () => {
    const result = parseIni("# comment\n[printer]\n# another\nkinematics: corexy");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].values.kinematics).toBe("corexy");
  });

  it("parses boolean values", () => {
    const result = parseIni("[section]\nenabled: true\ndisabled: false");
    expect(result.sections[0].values.enabled).toBe(true);
    expect(result.sections[0].values.disabled).toBe(false);
  });

  it("parses case-insensitive boolean values", () => {
    const result = parseIni("[section]\na: True\nb: False\nc: TRUE\nd: FALSE");
    expect(result.sections[0].values.a).toBe(true);
    expect(result.sections[0].values.b).toBe(false);
    expect(result.sections[0].values.c).toBe(true);
    expect(result.sections[0].values.d).toBe(false);
  });

  it("parses Python configparser boolean aliases (yes/no, on/off)", () => {
    const result = parseIni("[section]\na: yes\nb: no\nc: on\nd: off\ne: Yes\nf: NO");
    expect(result.sections[0].values.a).toBe(true);
    expect(result.sections[0].values.b).toBe(false);
    expect(result.sections[0].values.c).toBe(true);
    expect(result.sections[0].values.d).toBe(false);
    expect(result.sections[0].values.e).toBe(true);
    expect(result.sections[0].values.f).toBe(false);
  });

  it("keeps comma-separated values as strings", () => {
    const result = parseIni("[bed_mesh]\nmesh_min: 195,0\nmesh_max: 25, 0");
    expect(result.sections[0].values.mesh_min).toBe("195,0");
    expect(result.sections[0].values.mesh_max).toBe("25, 0");
  });

  it("parses plain numbers correctly", () => {
    const result = parseIni("[printer]\nmax_velocity: 300\nstep_distance: 0.4\noffset: -3");
    expect(result.sections[0].values.max_velocity).toBe(300);
    expect(result.sections[0].values.step_distance).toBe(0.4);
    expect(result.sections[0].values.offset).toBe(-3);
  });

  it("parses inline comments", () => {
    const result = parseIni("[stepper_x]\nstep_pin: PF13 # motor0\ndir_pin: PF12");
    expect(result.sections[0].values.step_pin).toBe("PF13");
    expect(result.sections[0].comments?.step_pin).toBe("motor0");
    expect(result.sections[0].comments?.dir_pin).toBeUndefined();
  });

  it("normalizes keys to lowercase by default", () => {
    const result = parseIni("[section]\npid_Kp: 26.213\npid_Ki: 1.304");
    expect(result.sections[0].values.pid_kp).toBe(26.213);
    expect(result.sections[0].values.pid_ki).toBe(1.304);
    expect(result.sections[0].values.pid_Kp).toBeUndefined();
  });

  it("preserves key case when lowercaseKeys is false", () => {
    const result = parseIni("[section]\npid_Kp: 26.213", { lowercaseKeys: false });
    expect(result.sections[0].values.pid_Kp).toBe(26.213);
    expect(result.sections[0].values.pid_kp).toBeUndefined();
  });

  it("parses multiline continuation lines", () => {
    const result = parseIni("[gcode_macro PRINT_START]\ngcode:\n    G28\n    G90\n    G1 Z5 F3000");
    expect(result.sections[0].values.gcode).toBe("G28\nG90\nG1 Z5 F3000");
  });

  it("handles multiline with empty initial value", () => {
    const result = parseIni("[gcode_macro TEST]\ngcode:\n    M104 S200\ndescription: test");
    expect(result.sections[0].values.gcode).toBe("M104 S200");
    expect(result.sections[0].values.description).toBe("test");
  });

  it("preserves comment lines within continuations", () => {
    const result = parseIni("[gcode_macro TEST]\ngcode:\n    # comment\n    G28");
    expect(result.sections[0].values.gcode).toBe("# comment\nG28");
  });

  it("parses both = and : delimiters by default", () => {
    const result = parseIni("[section]\nkey1: value1\nkey2 = value2");
    expect(result.sections[0].values.key1).toBe("value1");
    expect(result.sections[0].values.key2).toBe("value2");
  });

  it("respects custom delimiters option", () => {
    const result = parseIni("[section]\nkey1: value1\nkey2 = value2", { delimiters: ["="] });
    expect(result.sections[0].values.key2).toBe("value2");
    // "key1: value1" won't match as a key-value pair with only "=" delimiter
    expect(result.warnings).toHaveLength(1);
  });

  it("skips type coercion when disabled", () => {
    const result = parseIni("[section]\ncount: 42\nenabled: true", { typeCoercion: false });
    expect(result.sections[0].values.count).toBe("42");
    expect(result.sections[0].values.enabled).toBe("true");
  });

  describe("lone backslash handling", () => {
    it("keeps lone backslash as literal string by default", () => {
      const result = parseIni("[section]\nkey: \\");
      expect(result.sections[0].values.key).toBe("\\");
      expect(result.warnings).toHaveLength(0);
    });

    it("drops lone backslash with warning in drop mode", () => {
      const result = parseIni("[section]\nkey: \\", { loneBackslash: "drop" });
      expect(result.sections[0].values.key).toBeUndefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain("lone backslash");
    });
  });

  describe("warnings", () => {
    it("warns for unrecognized lines inside a section", () => {
      const result = parseIni("[printer]\nkinematics: corexy\nthis is garbage");
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].line).toBe(3);
      expect(result.warnings[0].raw).toBe("this is garbage");
      expect(result.warnings[0].message).toContain("Unrecognized line");
    });

    it("hints about malformed continuations starting with backslash", () => {
      const result = parseIni("[printer]\n\\continuation_attempt");
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain("malformed continuation");
    });

    it("warns for lines outside any section", () => {
      const result = parseIni("orphan: value\n[printer]\nkey: val");
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].line).toBe(1);
      expect(result.warnings[0].message).toContain("outside any section");
    });

    it("produces no warnings for valid input", () => {
      const result = parseIni("# comment\n[printer]\nkinematics: corexy\n\n[stepper]\npin: PA0");
      expect(result.warnings).toHaveLength(0);
    });
  });
});
