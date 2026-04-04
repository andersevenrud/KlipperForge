import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "../../sections/schemas";
import { serializeConfigWithSourceMap } from "../../sections/serializer";
import type { ConfigDocument } from "../../sections/types";

function expectLineContent(text: string, lineNum: number | undefined, expected: string) {
  expect(lineNum).toBeDefined();
  const lines = text.split("\n");
  expect(lines[(lineNum as number) - 1]).toContain(expected);
}

describe("serializeConfigWithSourceMap", () => {
  it("produces matching text to serializeConfig", () => {
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

    const { text } = serializeConfigWithSourceMap(doc, registry);
    expect(text).toContain("[printer]");
    expect(text).toContain("kinematics: cartesian");
  });

  it("maps section headers to correct line numbers", () => {
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
          data: {
            serial: "/dev/serial/by-id/usb-test",
          },
        },
      ],
    };

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);

    expect(sourceMap.sectionLines.get("printer")).toBe(1);
    expectLineContent(text, sourceMap.sectionLines.get("printer"), "[printer]");
    expectLineContent(text, sourceMap.sectionLines.get("mcu"), "[mcu]");
  });

  it("maps field names to correct line numbers", () => {
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

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);

    expectLineContent(text, sourceMap.fieldLines.get("printer::kinematics"), "kinematics: cartesian");
    expectLineContent(text, sourceMap.fieldLines.get("printer::max_velocity"), "max_velocity: 300");
  });

  it("maps suffixed section headers correctly", () => {
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

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);

    expect(sourceMap.sectionLines.get("stepper_x")).toBe(1);
    expectLineContent(text, sourceMap.sectionLines.get("stepper_x"), "[stepper_x]");
    expectLineContent(text, sourceMap.fieldLines.get("stepper_x::step_pin"), "step_pin: PF13");
  });

  it("tracks rawSectionLines for unmanaged sections", () => {
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
      rawSections: ["[gcode_macro START]\ngcode:\n  G28"],
    };

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);

    expect(sourceMap.rawSectionLines).toHaveLength(1);
    const rawLine = sourceMap.rawSectionLines[0];
    const lines = text.split("\n");
    expect(lines[rawLine - 1]).toContain("[gcode_macro START]");
  });

  it("handles multiple sections with correct line offsets", () => {
    const registry = createDefaultRegistry();
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: {
            kinematics: "cartesian",
            max_velocity: 300,
          },
        },
        {
          definitionId: "fan",
          data: { pin: "PA8" },
        },
      ],
    };

    const { text, sourceMap } = serializeConfigWithSourceMap(doc, registry);

    expectLineContent(text, sourceMap.sectionLines.get("fan"), "[fan]");
    expectLineContent(text, sourceMap.fieldLines.get("fan::pin"), "pin: PA8");
  });
});
