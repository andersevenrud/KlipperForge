import { describe, expect, it } from "vitest";
import { cfgToDocument } from "../import";
import { parseKlipperConfig } from "../parser";
import { createDefaultRegistry } from "../sections/schemas";
import { serializeConfig } from "../sections/serializer";

describe("include section", () => {
  const registry = createDefaultRegistry();

  it("single-file import: [include mainsail.cfg] becomes a managed section", () => {
    const input = "[include mainsail.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    const includeSection = doc.sections.find((s) => s.definitionId === "include");
    expect(includeSection).toBeDefined();
    expect(includeSection?.instanceName).toBe("mainsail.cfg");
  });

  it("preserves original section order in serialized output", () => {
    const input = "[include mainsail.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    const output = serializeConfig(doc, registry);
    const includeIndex = output.indexOf("[include mainsail.cfg]");
    const printerIndex = output.indexOf("[printer]");
    expect(includeIndex).toBeGreaterThan(-1);
    expect(printerIndex).toBeGreaterThan(-1);
    expect(includeIndex).toBeLessThan(printerIndex);
  });

  it("include sections serialize as just the header line with no body", () => {
    const input = "[include mainsail.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    const output = serializeConfig(doc, registry);
    const lines = output.split("\n");
    const includeLine = lines.indexOf("[include mainsail.cfg]");
    expect(includeLine).toBeGreaterThan(-1);
    // Next non-empty line should be a section header, not a key-value pair
    const nextNonEmpty = lines.slice(includeLine + 1).find((l) => l.trim() !== "");
    expect(nextNonEmpty).toMatch(/^\[/);
  });

  it("multiple include sections are preserved and ordered first", () => {
    const input =
      "[include mainsail.cfg]\n\n[include timelapse.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    const includes = doc.sections.filter((s) => s.definitionId === "include");
    expect(includes).toHaveLength(2);
    expect(includes[0].instanceName).toBe("mainsail.cfg");
    expect(includes[1].instanceName).toBe("timelapse.cfg");

    const output = serializeConfig(doc, registry);
    const mainsailIndex = output.indexOf("[include mainsail.cfg]");
    const timelapseIndex = output.indexOf("[include timelapse.cfg]");
    const printerIndex = output.indexOf("[printer]");
    expect(mainsailIndex).toBeLessThan(timelapseIndex);
    expect(timelapseIndex).toBeLessThan(printerIndex);

    // Consecutive includes should have no blank line between them
    expect(output).toContain("[include mainsail.cfg]\n[include timelapse.cfg]");
    // But there should be a blank line before the next non-include section
    expect(output).toContain("[include timelapse.cfg]\n\n[printer]");
  });

  it("include sections do not appear in rawSections", () => {
    const input = "[include mainsail.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    expect(doc.rawSections).toBeUndefined();
  });

  it("serialized output does not contain unmanaged marker for includes", () => {
    const input = "[include mainsail.cfg]\n\n[printer]\nkinematics: corexy\nmax_velocity: 300\nmax_accel: 3000\n";
    const parsed = parseKlipperConfig(input, { extended: true });
    const doc = cfgToDocument(parsed.sections, parsed.mcuBoards, registry);

    const output = serializeConfig(doc, registry);
    expect(output).not.toContain("klipperforge:unmanaged");
    expect(output).toContain("[include mainsail.cfg]");
  });
});
