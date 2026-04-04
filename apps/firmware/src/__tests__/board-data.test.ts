import { describe, expect, it } from "vitest";
import { loadBoardJson } from "../services/board-data";

describe("loadBoardJson", () => {
  it("rejects path traversal in board ID", () => {
    expect(loadBoardJson("../../../etc/passwd")).toBeNull();
    expect(loadBoardJson("../../package")).toBeNull();
    expect(loadBoardJson("foo/../bar")).toBeNull();
  });

  it("rejects board IDs with slashes", () => {
    expect(loadBoardJson("foo/bar")).toBeNull();
    expect(loadBoardJson("foo\\bar")).toBeNull();
  });

  it("rejects board IDs starting with special characters", () => {
    expect(loadBoardJson("-board")).toBeNull();
    expect(loadBoardJson(".board")).toBeNull();
    expect(loadBoardJson("_board")).toBeNull();
  });

  it("rejects empty board ID", () => {
    expect(loadBoardJson("")).toBeNull();
  });

  it("rejects uppercase board IDs", () => {
    expect(loadBoardJson("BTT-SKR")).toBeNull();
  });

  it("returns null for nonexistent but valid board IDs", () => {
    expect(loadBoardJson("nonexistent-board-xyz")).toBeNull();
  });
});
