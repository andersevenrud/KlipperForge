import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getMetaFieldSet, SectionRegistry } from "../../sections/registry";
import type { SectionDefinition } from "../../sections/types";

const testSchema = z
  .object({
    _name: z.string().optional(),
    pin: z.string(),
    speed: z.number().optional(),
  })
  .passthrough();

const testDef: SectionDefinition<typeof testSchema> = {
  id: "test",
  naming: { kind: "fixed", header: "test_section" },
  schema: testSchema,
  metaFields: ["_name"],
  order: 10,
};

describe("SectionRegistry", () => {
  it("registers and retrieves definitions", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    expect(registry.get("test")).toBe(testDef);
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("lists all definitions", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    const all = registry.all();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("test");
  });

  it("creates a valid instance", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    const instance = registry.createInstance("test", { pin: "PA0", speed: 10 });
    expect(instance.definitionId).toBe("test");
    expect(instance.data).toEqual({ pin: "PA0", speed: 10 });
    expect(instance.meta).toBeUndefined();
  });

  it("separates meta fields from data", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    const instance = registry.createInstance("test", {
      _name: "x",
      pin: "PA0",
    });
    expect(instance.data).toEqual({ pin: "PA0" });
    expect(instance.meta).toEqual({ _name: "x" });
  });

  it("passes through extra fields", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    const instance = registry.createInstance("test", {
      pin: "PA0",
      extra_field: "value",
    });
    expect(instance.data).toEqual({ pin: "PA0", extra_field: "value" });
  });

  it("throws on unknown definition", () => {
    const registry = new SectionRegistry();
    expect(() => registry.createInstance("unknown", {})).toThrow("Unknown section definition: unknown");
  });

  it("validates data against schema", () => {
    const registry = new SectionRegistry();
    registry.register(testDef);

    const valid = registry.validate("test", { pin: "PA0" });
    expect(valid.success).toBe(true);

    const invalid = registry.validate("test", { pin: 123 });
    expect(invalid.success).toBe(false);
  });

  it("validate throws on unknown definition", () => {
    const registry = new SectionRegistry();
    expect(() => registry.validate("unknown", {})).toThrow("Unknown section definition: unknown");
  });
});

describe("getMetaFieldSet", () => {
  it("returns an empty Set when definition is undefined", () => {
    expect(getMetaFieldSet(undefined)).toEqual(new Set());
  });

  it("returns an empty Set when metaFields is missing", () => {
    const def: SectionDefinition = {
      id: "x",
      naming: { kind: "fixed", header: "x" },
      schema: z.object({}).passthrough(),
      order: 0,
    };
    expect(getMetaFieldSet(def)).toEqual(new Set());
  });

  it("returns a Set of the metaFields entries", () => {
    expect(getMetaFieldSet(testDef)).toEqual(new Set(["_name"]));
  });
});
