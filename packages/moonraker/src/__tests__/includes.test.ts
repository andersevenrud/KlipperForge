import { describe, expect, it } from "vitest";
import { extractIncludePaths, matchGlobPattern, resolveIncludes } from "../includes";

describe("extractIncludePaths", () => {
  it("extracts single include", () => {
    const content = "[printer]\nkinematics = cartesian\n\n[include macros.cfg]\n\n[stepper_x]";
    expect(extractIncludePaths(content)).toEqual(["macros.cfg"]);
  });

  it("extracts multiple includes", () => {
    const content = "[include macros.cfg]\n[include steppers.cfg]\n[include fans/cooling.cfg]";
    expect(extractIncludePaths(content)).toEqual(["macros.cfg", "steppers.cfg", "fans/cooling.cfg"]);
  });

  it("extracts glob includes", () => {
    const content = "[include macros/*.cfg]\n[include overrides/*.cfg]";
    expect(extractIncludePaths(content)).toEqual(["macros/*.cfg", "overrides/*.cfg"]);
  });

  it("trims whitespace from paths", () => {
    const content = "[include   macros.cfg  ]";
    expect(extractIncludePaths(content)).toEqual(["macros.cfg"]);
  });

  it("returns empty for no includes", () => {
    const content = "[printer]\nkinematics = cartesian\n[stepper_x]\nstep_pin = PF0";
    expect(extractIncludePaths(content)).toEqual([]);
  });

  it("ignores include-like text in values", () => {
    const content = "[printer]\nkinematics = cartesian\n# [include fake.cfg]\n";
    expect(extractIncludePaths(content)).toEqual([]);
  });
});

describe("matchGlobPattern", () => {
  const files = [
    "printer.cfg",
    "macros.cfg",
    "macros/print.cfg",
    "macros/homing.cfg",
    "macros/test.txt",
    "overrides/steppers.cfg",
    "overrides/fans.cfg",
  ];

  it("matches wildcard in filename", () => {
    expect(matchGlobPattern("macros/*.cfg", files)).toEqual(["macros/print.cfg", "macros/homing.cfg"]);
  });

  it("matches wildcard at root", () => {
    expect(matchGlobPattern("*.cfg", files)).toEqual(["printer.cfg", "macros.cfg"]);
  });

  it("does not cross directory boundaries with *", () => {
    expect(matchGlobPattern("*.cfg", files)).not.toContain("macros/print.cfg");
  });

  it("matches ** across directories", () => {
    const result = matchGlobPattern("**/*.cfg", files);
    expect(result).toContain("macros/print.cfg");
    expect(result).toContain("overrides/steppers.cfg");
  });

  it("returns empty for no matches", () => {
    expect(matchGlobPattern("nonexistent/*.cfg", files)).toEqual([]);
  });

  it("matches exact filename", () => {
    expect(matchGlobPattern("printer.cfg", files)).toEqual(["printer.cfg"]);
  });
});

describe("resolveIncludes", () => {
  it("resolves a simple include chain", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include macros.cfg]\n[printer]\nkinematics = cartesian",
      "macros.cfg": "[gcode_macro TEST]\ngcode: G28",
    };
    const available = Object.keys(files);

    const result = await resolveIncludes("printer.cfg", files["printer.cfg"], available, async (path) => files[path]);

    expect(result.files).toHaveLength(2);
    expect(result.files[0].path).toBe("printer.cfg");
    expect(result.files[0].includedBy).toBeNull();
    expect(result.files[1].path).toBe("macros.cfg");
    expect(result.files[1].includedBy).toBe("printer.cfg");
    expect(result.errors).toHaveLength(0);
  });

  it("resolves nested includes", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include steppers.cfg]",
      "steppers.cfg": "[include steppers/x.cfg]\n[include steppers/y.cfg]",
      "steppers/x.cfg": "[stepper_x]",
      "steppers/y.cfg": "[stepper_y]",
    };
    const available = Object.keys(files);

    const result = await resolveIncludes("printer.cfg", files["printer.cfg"], available, async (path) => files[path]);

    expect(result.files).toHaveLength(4);
    expect(result.files.map((f) => f.path)).toEqual([
      "printer.cfg",
      "steppers.cfg",
      "steppers/x.cfg",
      "steppers/y.cfg",
    ]);
    expect(result.errors).toHaveLength(0);
  });

  it("detects circular includes", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include a.cfg]",
      "a.cfg": "[include printer.cfg]",
    };
    const available = Object.keys(files);

    const result = await resolveIncludes("printer.cfg", files["printer.cfg"], available, async (path) => files[path]);

    expect(result.files).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Circular");
  });

  it("reports missing files as errors", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include missing.cfg]\n[printer]",
    };

    const result = await resolveIncludes("printer.cfg", files["printer.cfg"], ["printer.cfg"], async (path) => {
      throw new Error(`not found: ${path}`);
    });

    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("not found");
  });

  it("resolves glob includes", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include macros/*.cfg]",
      "macros/print.cfg": "[gcode_macro PRINT]",
      "macros/home.cfg": "[gcode_macro HOME]",
    };
    const available = Object.keys(files);

    const result = await resolveIncludes("printer.cfg", files["printer.cfg"], available, async (path) => files[path]);

    expect(result.files).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it("reports unmatched glob patterns", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include nonexistent/*.cfg]",
    };

    const result = await resolveIncludes(
      "printer.cfg",
      files["printer.cfg"],
      ["printer.cfg"],
      async (path) => files[path],
    );

    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("No files matched");
  });

  it("handles fetch failures gracefully", async () => {
    const files: Record<string, string> = {
      "printer.cfg": "[include flaky.cfg]",
    };

    const result = await resolveIncludes(
      "printer.cfg",
      files["printer.cfg"],
      ["printer.cfg", "flaky.cfg"],
      async (path) => {
        if (path === "flaky.cfg") throw new Error("network error");
        return files[path];
      },
    );

    expect(result.files).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Failed to fetch");
  });
});
