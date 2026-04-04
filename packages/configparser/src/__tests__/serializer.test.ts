import { describe, expect, it } from "vitest";
import { parseIni } from "../parser";
import { formatMultilineValue, formatValue, normalizeValue, serializeIni } from "../serializer";
import type { IniSection } from "../types";

describe("normalizeValue", () => {
  it("normalizes comma-separated numeric strings", () => {
    expect(normalizeValue("195,0")).toBe("195, 0");
    expect(normalizeValue("25, 0")).toBe("25, 0");
    expect(normalizeValue("1,2,3")).toBe("1, 2, 3");
  });

  it("passes through non-comma strings", () => {
    expect(normalizeValue("hello world")).toBe("hello world");
    expect(normalizeValue("PF13")).toBe("PF13");
  });

  it("passes through non-string values", () => {
    expect(normalizeValue(42)).toBe(42);
    expect(normalizeValue(true)).toBe(true);
    expect(normalizeValue(false)).toBe(false);
  });
});

describe("formatValue", () => {
  it("formats booleans with capitalized style by default", () => {
    expect(formatValue(true)).toBe("True");
    expect(formatValue(false)).toBe("False");
  });

  it("formats booleans with lowercase style", () => {
    expect(formatValue(true, { booleanStyle: "lowercase" })).toBe("true");
    expect(formatValue(false, { booleanStyle: "lowercase" })).toBe("false");
  });

  it("formats booleans with uppercase style", () => {
    expect(formatValue(true, { booleanStyle: "uppercase" })).toBe("TRUE");
    expect(formatValue(false, { booleanStyle: "uppercase" })).toBe("FALSE");
  });

  it("formats numbers as strings", () => {
    expect(formatValue(42)).toBe("42");
    expect(formatValue(3.14)).toBe("3.14");
  });

  it("formats strings with comma normalization", () => {
    expect(formatValue("195,0")).toBe("195, 0");
  });
});

describe("serializeIni", () => {
  it("serializes a simple section", () => {
    const sections: IniSection[] = [
      { type: "printer", name: "printer", values: { kinematics: "corexy", max_velocity: 300 } },
    ];
    expect(serializeIni(sections)).toBe("[printer]\nkinematics: corexy\nmax_velocity: 300\n");
  });

  it("serializes named sections", () => {
    const sections: IniSection[] = [{ type: "heater_fan", name: "hotend_fan", values: { pin: "PA8" } }];
    expect(serializeIni(sections)).toBe("[heater_fan hotend_fan]\npin: PA8\n");
  });

  it("serializes boolean values", () => {
    const sections: IniSection[] = [{ type: "section", name: "section", values: { enabled: true, disabled: false } }];
    expect(serializeIni(sections)).toBe("[section]\nenabled: True\ndisabled: False\n");
  });

  it("serializes multiline values", () => {
    const sections: IniSection[] = [{ type: "macro", name: "macro", values: { gcode: "G28\nG90\nG1 Z5" } }];
    expect(serializeIni(sections)).toBe("[macro]\ngcode: \n    G28\n    G90\n    G1 Z5\n");
  });

  it("serializes inline comments", () => {
    const sections: IniSection[] = [
      {
        type: "stepper",
        name: "stepper",
        values: { step_pin: "PF13" },
        comments: { step_pin: "motor0" },
      },
    ];
    expect(serializeIni(sections)).toBe("[stepper]\nstep_pin: PF13 # motor0\n");
  });

  it("separates sections with blank line by default", () => {
    const sections: IniSection[] = [
      { type: "a", name: "a", values: { x: 1 } },
      { type: "b", name: "b", values: { y: 2 } },
    ];
    expect(serializeIni(sections)).toBe("[a]\nx: 1\n\n[b]\ny: 2\n");
  });

  it("uses custom delimiter", () => {
    const sections: IniSection[] = [{ type: "section", name: "section", values: { key: "value" } }];
    expect(serializeIni(sections, { delimiter: " = " })).toBe("[section]\nkey = value\n");
  });

  it("uses custom multiline indent", () => {
    const sections: IniSection[] = [{ type: "section", name: "section", values: { gcode: "G28\nG90" } }];
    expect(serializeIni(sections, { multilineIndent: "\t" })).toBe("[section]\ngcode: \n\tG28\n\tG90\n");
  });

  it("returns empty string for empty input", () => {
    expect(serializeIni([])).toBe("");
  });

  it("serializes multiline values with Jinja2 indentation", () => {
    const gcode = "{% if printer.pause_resume.is_paused %}\nM104 S0\n{% else %}\nTURN_OFF_HEATERS\n{% endif %}";
    const sections: IniSection[] = [{ type: "macro", name: "macro", values: { gcode } }];
    const expected = [
      "[macro]",
      "gcode: ",
      "    {% if printer.pause_resume.is_paused %}",
      "        M104 S0",
      "    {% else %}",
      "        TURN_OFF_HEATERS",
      "    {% endif %}",
      "",
    ].join("\n");
    expect(serializeIni(sections)).toBe(expected);
  });

  it("serializes nested Jinja2 blocks with increasing indentation", () => {
    const gcode = "{% for i in range(3) %}\n{% if i > 0 %}\nG1 X{i}\n{% endif %}\n{% endfor %}";
    const sections: IniSection[] = [{ type: "macro", name: "macro", values: { gcode } }];
    const expected = [
      "[macro]",
      "gcode: ",
      "    {% for i in range(3) %}",
      "        {% if i > 0 %}",
      "            G1 X{i}",
      "        {% endif %}",
      "    {% endfor %}",
      "",
    ].join("\n");
    expect(serializeIni(sections)).toBe(expected);
  });

  it("round-trips through parse and serialize", () => {
    const sections: IniSection[] = [
      {
        type: "printer",
        name: "printer",
        values: { kinematics: "corexy", max_velocity: 300, enabled: true },
      },
      { type: "stepper_x", name: "stepper_x", values: { step_pin: "PF13", microsteps: 16 } },
    ];
    const serialized = serializeIni(sections);
    const parsed = parseIni(serialized);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0].values.kinematics).toBe("corexy");
    expect(parsed.sections[0].values.max_velocity).toBe(300);
    expect(parsed.sections[0].values.enabled).toBe(true);
    expect(parsed.sections[1].values.step_pin).toBe("PF13");
    expect(parsed.sections[1].values.microsteps).toBe(16);
  });
});

describe("formatMultilineValue", () => {
  it("indents plain lines at base level", () => {
    const result = formatMultilineValue("G28\nG90\nG1 Z5", "    ");
    expect(result).toBe("    G28\n    G90\n    G1 Z5");
  });

  it("indents Jinja2 if/else/endif blocks", () => {
    const input = "{% if x %}\nM104 S0\n{% else %}\nM140 S0\n{% endif %}";
    const result = formatMultilineValue(input, "    ");
    expect(result).toBe(
      ["    {% if x %}", "        M104 S0", "    {% else %}", "        M140 S0", "    {% endif %}"].join("\n"),
    );
  });

  it("indents nested Jinja2 blocks", () => {
    const input = "{% for i in range(3) %}\n{% if i > 0 %}\nG1 X{i}\n{% endif %}\n{% endfor %}";
    const result = formatMultilineValue(input, "    ");
    expect(result).toBe(
      [
        "    {% for i in range(3) %}",
        "        {% if i > 0 %}",
        "            G1 X{i}",
        "        {% endif %}",
        "    {% endfor %}",
      ].join("\n"),
    );
  });

  it("handles mixed gcode and Jinja2 content", () => {
    const input = "G28\n{% if printer.toolhead.homed_axes == 'xyz' %}\nG90\nG1 Z10 F3000\n{% endif %}\nM84";
    const result = formatMultilineValue(input, "    ");
    expect(result).toBe(
      [
        "    G28",
        "    {% if printer.toolhead.homed_axes == 'xyz' %}",
        "        G90",
        "        G1 Z10 F3000",
        "    {% endif %}",
        "    M84",
      ].join("\n"),
    );
  });

  it("preserves empty lines", () => {
    const result = formatMultilineValue("G28\n\nG90", "    ");
    expect(result).toBe("    G28\n\n    G90");
  });

  it("handles whitespace-only tag syntax {%- ... -%}", () => {
    const input = "{%- if x %}\nM104\n{%- endif %}";
    const result = formatMultilineValue(input, "    ");
    expect(result).toBe("    {%- if x %}\n        M104\n    {%- endif %}");
  });
});
