import { describe, expect, it } from "vitest";
import { computeChangedLines } from "../utils/line-diff";

describe("computeChangedLines", () => {
  it("returns empty array for identical texts", () => {
    const text = "line1\nline2\nline3";
    expect(computeChangedLines(text, text)).toEqual([]);
  });

  it("returns empty array for both empty", () => {
    expect(computeChangedLines("", "")).toEqual([]);
  });

  it("detects a single line changed", () => {
    const baseline = "aaa\nbbb\nccc";
    const current = "aaa\nBBB\nccc";
    expect(computeChangedLines(baseline, current)).toEqual([2]);
  });

  it("detects a line added at the end", () => {
    const baseline = "aaa\nbbb";
    const current = "aaa\nbbb\nccc";
    expect(computeChangedLines(baseline, current)).toEqual([3]);
  });

  it("detects a line added in the middle", () => {
    const baseline = "aaa\nccc";
    const current = "aaa\nbbb\nccc";
    expect(computeChangedLines(baseline, current)).toEqual([2]);
  });

  it("detects a line removed", () => {
    const baseline = "aaa\nbbb\nccc";
    const current = "aaa\nccc";
    // No lines in current are new — the removed line just disappears
    expect(computeChangedLines(baseline, current)).toEqual([]);
  });

  it("detects a section added", () => {
    const baseline = "[printer]\nkinematics: cartesian";
    const current = "[printer]\nkinematics: cartesian\n\n[fan]\npin: PA8";
    expect(computeChangedLines(baseline, current)).toEqual([3, 4, 5]);
  });

  it("detects multiple scattered changes", () => {
    const baseline = "a\nb\nc\nd\ne";
    const current = "a\nB\nc\nD\ne";
    expect(computeChangedLines(baseline, current)).toEqual([2, 4]);
  });

  it("handles empty baseline (all lines are new)", () => {
    const current = "aaa\nbbb";
    expect(computeChangedLines("", current)).toEqual([1, 2]);
  });

  it("handles empty current (single empty line differs from baseline)", () => {
    const baseline = "aaa\nbbb";
    // "" splits to [""] — one empty line not in baseline's LCS
    expect(computeChangedLines(baseline, "")).toEqual([1]);
  });

  it("detects section removed leaves no changed lines", () => {
    const baseline = "[printer]\nkinematics: cartesian\n\n[fan]\npin: PA8";
    const current = "[printer]\nkinematics: cartesian";
    expect(computeChangedLines(baseline, current)).toEqual([]);
  });
});
