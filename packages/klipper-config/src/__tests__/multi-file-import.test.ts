import { describe, expect, it } from "vitest";
import { parseMultiFileConfigs } from "../import";
import { createDefaultRegistry } from "../sections/schemas";
import { serializeMultiFileConfig } from "../sections/serializer";

describe("parseMultiFileConfigs", () => {
  const registry = createDefaultRegistry();

  it("returns empty document for no files", () => {
    const doc = parseMultiFileConfigs([], registry);
    expect(doc.sections).toEqual([]);
  });

  it("parses single file and tags sections", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "printer.cfg",
          content: "[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
      ],
      registry,
    );

    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].file).toBe("printer.cfg");
    expect(doc.sections[0].definitionId).toBe("printer");
    expect(doc.files).toEqual(["printer.cfg"]);
  });

  it("merges multiple files and tags each section", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "printer.cfg",
          content: "[include fans.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
        {
          name: "fans.cfg",
          content: "[fan]\npin: PA8\n",
        },
      ],
      registry,
    );

    expect(doc.sections).toHaveLength(3);

    const includeSection = doc.sections.find((s) => s.definitionId === "include");
    expect(includeSection?.file).toBe("printer.cfg");
    expect(includeSection?.instanceName).toBe("fans.cfg");

    const printerSection = doc.sections.find((s) => s.definitionId === "printer");
    expect(printerSection?.file).toBe("printer.cfg");

    const fanSection = doc.sections.find((s) => s.definitionId === "fan");
    expect(fanSection?.file).toBe("fans.cfg");
  });

  it("preserves [include] sections as managed instances", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "printer.cfg",
          content: "[include fans.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
        {
          name: "fans.cfg",
          content: "[fan]\npin: PA8\n",
        },
      ],
      registry,
    );

    const includeSection = doc.sections.find((s) => s.definitionId === "include");
    expect(includeSection).toBeDefined();
    expect(includeSection?.instanceName).toBe("fans.cfg");
    expect(includeSection?.file).toBe("printer.cfg");
  });

  it("determines file order from [include] directives", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "fans.cfg",
          content: "[fan]\npin: PA8\n",
        },
        {
          name: "printer.cfg",
          content: "[include fans.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
      ],
      registry,
    );

    expect(doc.files).toEqual(["printer.cfg", "fans.cfg"]);
  });

  it("uses file with [include] as main file", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "extra.cfg",
          content: "[fan]\npin: PA8\n",
        },
        {
          name: "main.cfg",
          content: "[include extra.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
      ],
      registry,
    );

    expect(doc.files?.[0]).toBe("main.cfg");
  });

  it("falls back to printer.cfg as main file", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "fans.cfg",
          content: "[fan]\npin: PA8\n",
        },
        {
          name: "printer.cfg",
          content: "[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
      ],
      registry,
    );

    expect(doc.files?.[0]).toBe("printer.cfg");
  });

  it("round-trips: import multiple files → serialize → verify", () => {
    const doc = parseMultiFileConfigs(
      [
        {
          name: "printer.cfg",
          content: "[include fans.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n",
        },
        {
          name: "fans.cfg",
          content: "[fan]\npin: PA8\n",
        },
      ],
      registry,
    );

    const output = serializeMultiFileConfig(doc, registry);

    expect(output.files.size).toBe(2);
    expect(output.files.get("printer.cfg")).toContain("[printer]");
    expect(output.files.get("printer.cfg")).toContain("[include fans.cfg]");
    expect(output.files.get("fans.cfg")).toContain("[fan]");
    expect(output.files.get("fans.cfg")).toContain("pin: PA8");
  });
});
