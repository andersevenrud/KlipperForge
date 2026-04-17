import type { ConfigDocument } from "@klipperforge/klipper-config";
import { describe, expect, it } from "vitest";
import { buildStateForDocument, configReducer } from "../config-context";

function baseDocument(): ConfigDocument {
  return {
    sections: [
      { definitionId: "printer", data: { kinematics: "cartesian" } },
      { definitionId: "mcu", data: {} },
    ],
  };
}

describe("configReducer history", () => {
  it("records UPDATE_SECTION on past and restores it via UNDO", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    expect(edited.past).toHaveLength(1);
    expect(edited.future).toHaveLength(0);
    const printer = edited.document.sections.find((s) => s.definitionId === "printer");
    expect(printer?.data.kinematics).toBe("corexy");

    const undone = configReducer(edited, { type: "UNDO" });
    expect(undone.past).toHaveLength(0);
    expect(undone.future).toHaveLength(1);
    const undonePrinter = undone.document.sections.find((s) => s.definitionId === "printer");
    expect(undonePrinter?.data.kinematics).toBe("cartesian");
  });

  it("replays a change with REDO", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const undone = configReducer(edited, { type: "UNDO" });
    const redone = configReducer(undone, { type: "REDO" });
    expect(redone.past).toHaveLength(1);
    expect(redone.future).toHaveLength(0);
    const printer = redone.document.sections.find((s) => s.definitionId === "printer");
    expect(printer?.data.kinematics).toBe("corexy");
  });

  it("clears past and future on SET_PRESET", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    expect(edited.past).toHaveLength(1);
    const preset = configReducer(edited, {
      type: "SET_PRESET",
      payload: {
        sections: [{ definitionId: "printer", data: { kinematics: "delta" } }],
        presetId: "test-preset",
      },
    });
    expect(preset.past).toHaveLength(0);
    expect(preset.future).toHaveLength(0);
  });

  it("clears past and future on LOAD_DOCUMENT and RESET_CONFIG", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const loaded = configReducer(edited, {
      type: "LOAD_DOCUMENT",
      payload: { document: baseDocument(), dirty: false },
    });
    expect(loaded.past).toHaveLength(0);
    expect(loaded.future).toHaveLength(0);

    const editedAgain = configReducer(loaded, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    expect(editedAgain.past).toHaveLength(1);
    const reset = configReducer(editedAgain, { type: "RESET_CONFIG" });
    expect(reset.past).toHaveLength(0);
    expect(reset.future).toHaveLength(0);
  });

  it("coalesces rapid UPDATE_SECTION on the same header", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const first = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const second = configReducer(first, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "delta" } },
    });
    expect(second.past).toHaveLength(1);
    const undone = configReducer(second, { type: "UNDO" });
    const printer = undone.document.sections.find((s) => s.definitionId === "printer");
    expect(printer?.data.kinematics).toBe("cartesian");
  });

  it("does not coalesce UPDATE_SECTION on different headers", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const first = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const second = configReducer(first, {
      type: "UPDATE_SECTION",
      payload: { header: "mcu", data: { serial: "/dev/ttyUSB0" } },
    });
    expect(second.past).toHaveLength(2);
  });

  it("UNDO is a no-op when past is empty", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const result = configReducer(initial, { type: "UNDO" });
    expect(result).toBe(initial);
  });

  it("REDO is a no-op when future is empty", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const result = configReducer(edited, { type: "REDO" });
    expect(result).toBe(edited);
  });

  it("a new mutation after UNDO clears the redo stack", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    const undone = configReducer(edited, { type: "UNDO" });
    expect(undone.future).toHaveLength(1);
    const newEdit = configReducer(undone, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "delta" } },
    });
    expect(newEdit.future).toHaveLength(0);
    expect(newEdit.past).toHaveLength(1);
  });

  it("clears past and future and unsets isDirty on MARK_CLEAN", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const edited = configReducer(initial, {
      type: "UPDATE_SECTION",
      payload: { header: "printer", data: { kinematics: "corexy" } },
    });
    expect(edited.past).toHaveLength(1);
    expect(edited.isDirty).toBe(true);
    const cleaned = configReducer(edited, { type: "MARK_CLEAN" });
    expect(cleaned.isDirty).toBe(false);
    expect(cleaned.past).toHaveLength(0);
    expect(cleaned.future).toHaveLength(0);
  });

  it("skips history for SET_MCU_BOARDS when markDirty is false", () => {
    const initial = buildStateForDocument(baseDocument(), false);
    const result = configReducer(initial, {
      type: "SET_MCU_BOARDS",
      payload: { mcuBoards: [{ alias: "mcu", boardId: "btt-octopus-pro-1.1" }], markDirty: false },
    });
    expect(result.past).toHaveLength(0);
  });
});
