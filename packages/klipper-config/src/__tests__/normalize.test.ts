import { describe, expect, it } from "vitest";
import { z } from "zod";
import { computeHiddenFields, normalizeSectionData } from "../sections/normalize";
import type { SectionParams } from "../sections/param-types";
import type { SectionDefinition } from "../sections/types";

const stubParams: SectionParams = {
  control: {
    type: { kind: "choice", choices: ["pid", "watermark"] },
    description: "Control algorithm",
    required: false,
  },
  pid_kp: {
    type: { kind: "number" },
    description: "PID Kp",
    required: false,
    visibleWhen: { field: "control", value: "pid" },
  },
  pid_ki: {
    type: { kind: "number" },
    description: "PID Ki",
    required: false,
    visibleWhen: { field: "control", value: "pid" },
  },
  max_delta: {
    type: { kind: "number" },
    description: "Watermark delta",
    required: false,
    visibleWhen: { field: "control", value: "watermark" },
  },
  sensor_pin: {
    type: { kind: "string" },
    description: "Sensor pin",
    required: false,
  },
  min_temp: {
    type: { kind: "number" },
    description: "Min temperature",
    required: false,
  },
};

const stubDefinition: SectionDefinition = {
  id: "extruder",
  naming: { kind: "fixed", header: "extruder" },
  schema: z.object({}).passthrough(),
  params: stubParams,
  metaFields: ["_board"],
};

describe("computeHiddenFields", () => {
  it("hides PID fields when control is watermark", () => {
    const hidden = computeHiddenFields(stubParams, "extruder", { control: "watermark" });
    expect(hidden.has("pid_kp")).toBe(true);
    expect(hidden.has("pid_ki")).toBe(true);
    expect(hidden.has("max_delta")).toBe(false);
  });

  it("hides watermark fields when control is pid", () => {
    const hidden = computeHiddenFields(stubParams, "extruder", { control: "pid" });
    expect(hidden.has("max_delta")).toBe(true);
    expect(hidden.has("pid_kp")).toBe(false);
    expect(hidden.has("pid_ki")).toBe(false);
  });

  it("does not hide fields when watched value is undefined", () => {
    const hidden = computeHiddenFields(stubParams, "extruder", {});
    expect(hidden.has("pid_kp")).toBe(false);
    expect(hidden.has("max_delta")).toBe(false);
  });

  it("includes mode-hidden fields when mode is provided", () => {
    const tmcParams: SectionParams = {
      uart_pin: { type: { kind: "string" }, description: "UART pin", required: false },
      cs_pin: { type: { kind: "string" }, description: "SPI chip select", required: false },
      run_current: { type: { kind: "number" }, description: "Run current", required: false },
    };

    const hidden = computeHiddenFields(tmcParams, "tmc2209", { uart_pin: "PA10" }, "uart");
    expect(hidden.has("cs_pin")).toBe(true);
    expect(hidden.has("uart_pin")).toBe(false);
    expect(hidden.has("run_current")).toBe(false);
  });

  it("provides reason strings", () => {
    const hidden = computeHiddenFields(stubParams, "extruder", { control: "watermark" });
    const reason = hidden.get("pid_kp");
    expect(reason).toContain("control");
    expect(reason).toContain("pid");
  });

  it("provides mode reason strings", () => {
    const tmcParams: SectionParams = {
      cs_pin: { type: { kind: "string" }, description: "SPI chip select", required: false },
    };
    const hidden = computeHiddenFields(tmcParams, "tmc2209", {}, "uart");
    const reason = hidden.get("cs_pin");
    expect(reason).toContain("UART");
    expect(reason).toContain("mode");
  });
});

describe("normalizeSectionData", () => {
  it("drops empty string and undefined values", () => {
    const { data } = normalizeSectionData(
      { control: "pid", pid_kp: "", sensor_pin: undefined, min_temp: 0 },
      { definition: stubDefinition },
    );
    expect(data).toEqual({ control: "pid", min_temp: 0 });
  });

  it("separates meta fields", () => {
    const { data, meta } = normalizeSectionData(
      { control: "pid", _board: "btt-octopus" },
      { definition: stubDefinition },
    );
    expect(data).toEqual({ control: "pid" });
    expect(meta).toEqual({ _board: "btt-octopus" });
  });

  it("returns undefined meta when no meta fields present", () => {
    const { meta } = normalizeSectionData({ control: "pid" }, { definition: stubDefinition });
    expect(meta).toBeUndefined();
  });

  it("drops overridden fields", () => {
    const { data } = normalizeSectionData(
      { control: "pid", pid_kp: 25.0, min_temp: 0 },
      { definition: stubDefinition, overriddenFields: new Set(["pid_kp"]) },
    );
    expect(data.pid_kp).toBeUndefined();
    expect(data.control).toBe("pid");
  });

  it("preserves visibility-hidden fields (filtering deferred to serializer)", () => {
    const { data } = normalizeSectionData(
      { control: "watermark", pid_kp: 25.0, max_delta: 2 },
      { definition: stubDefinition },
    );
    expect(data.pid_kp).toBe(25.0);
    expect(data.max_delta).toBe(2);
    expect(data.control).toBe("watermark");
  });

  it("preserves mode-hidden fields (mode filtering deferred to serializer)", () => {
    const tmcDef: SectionDefinition = {
      id: "tmc2209",
      naming: { kind: "named", prefix: "tmc2209" },
      schema: z.object({}).passthrough(),
      params: {
        uart_pin: { type: { kind: "string" }, description: "UART pin", required: false },
        cs_pin: { type: { kind: "string" }, description: "SPI chip select", required: false },
        run_current: { type: { kind: "number" }, description: "Run current", required: false },
      },
    };

    const { data } = normalizeSectionData(
      { uart_pin: "PA10", cs_pin: "PA4", run_current: 0.8 },
      { definition: tmcDef },
    );
    expect(data.uart_pin).toBe("PA10");
    expect(data.cs_pin).toBe("PA4");
    expect(data.run_current).toBe(0.8);
  });

  it("preserves zero and false values", () => {
    const boolDef: SectionDefinition = {
      id: "test",
      naming: { kind: "fixed", header: "test" },
      schema: z.object({}).passthrough(),
      params: {
        enabled: { type: { kind: "boolean" }, description: "Enabled", required: false },
        count: { type: { kind: "number" }, description: "Count", required: false },
      },
    };

    const { data } = normalizeSectionData({ enabled: false, count: 0 }, { definition: boolDef });
    expect(data.enabled).toBe(false);
    expect(data.count).toBe(0);
  });
});
