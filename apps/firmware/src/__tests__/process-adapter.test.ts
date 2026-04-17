import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { config } from "../config";
import { processAdapter } from "../services/adapters/process-adapter";

const MAKEFILE_SUCCESS = [
  ".DEFAULT_GOAL := all",
  "",
  "olddefconfig:",
  "\t@echo olddefconfig ran",
  "",
  "all:",
  "\t@echo building klipper.bin",
  "\t@mkdir -p out",
  "\t@printf 'fake-binary' > out/klipper.bin",
  "",
  ".PHONY: olddefconfig all",
  "",
].join("\n");

const MAKEFILE_FAILURE = [
  ".DEFAULT_GOAL := all",
  "",
  "olddefconfig:",
  "\t@echo olddefconfig ran",
  "",
  "all:",
  "\t@echo compiling; exit 7",
  "",
  ".PHONY: olddefconfig all",
  "",
].join("\n");

const MAKEFILE_ECHO_PATHS = [
  ".DEFAULT_GOAL := all",
  "",
  "olddefconfig:",
  "\t@echo olddefconfig ran",
  "",
  "all:",
  "\t@echo resolved=$$(pwd -P)/out/klipper.bin",
  "\t@mkdir -p out",
  "\t@printf 'fake-binary' > out/klipper.bin",
  "",
  ".PHONY: olddefconfig all",
  "",
].join("\n");

const MAKEFILE_SLEEP = [
  ".DEFAULT_GOAL := all",
  "",
  "olddefconfig:",
  "\t@echo olddefconfig ran",
  "",
  "all:",
  "\t@sleep 30",
  "",
  ".PHONY: olddefconfig all",
  "",
].join("\n");

let tmpRoot: string;
let originalKlipperPath: string;

function setupFakeKlipper(makefile: string): string {
  const klipperDir = join(tmpRoot, "klipper");
  mkdirSync(klipperDir, { recursive: true });
  writeFileSync(join(klipperDir, "Makefile"), makefile);
  return klipperDir;
}

function setupBuildDir(): string {
  const buildDir = join(tmpRoot, `build-${Math.random().toString(36).slice(2)}`);
  mkdirSync(buildDir, { recursive: true });
  writeFileSync(join(buildDir, ".config"), "CONFIG_STUB=y\n");
  return buildDir;
}

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), "kf-adapter-test-"));
  originalKlipperPath = config.klipperSourcePath;
});

afterEach(() => {
  config.klipperSourcePath = originalKlipperPath;
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("processAdapter", () => {
  it("runs make, streams logs, and produces the output file", async () => {
    config.klipperSourcePath = setupFakeKlipper(MAKEFILE_SUCCESS);
    const buildDir = setupBuildDir();
    const logs: string[] = [];

    await processAdapter.run({
      jobId: "test-happy-path",
      buildDir,
      outputFile: "klipper.bin",
      signal: new AbortController().signal,
      log: (line) => logs.push(line),
    });

    const output = readFileSync(join(buildDir, "klipper.bin"), "utf-8");
    expect(output).toBe("fake-binary");
    expect(logs.some((line) => line.includes("olddefconfig ran"))).toBe(true);
    expect(logs.some((line) => line.includes("building klipper.bin"))).toBe(true);
  });

  it("throws with the exit code when make fails", async () => {
    config.klipperSourcePath = setupFakeKlipper(MAKEFILE_FAILURE);
    const buildDir = setupBuildDir();

    await expect(
      processAdapter.run({
        jobId: "test-failure",
        buildDir,
        outputFile: "klipper.bin",
        signal: new AbortController().signal,
        log: () => {},
      }),
    ).rejects.toThrow(/Build failed \(exit code \d+\)/);
  });

  it("redacts the absolute build directory from streamed log lines", async () => {
    config.klipperSourcePath = setupFakeKlipper(MAKEFILE_ECHO_PATHS);
    const buildDir = setupBuildDir();
    const logs: string[] = [];

    await processAdapter.run({
      jobId: "test-redact",
      buildDir,
      outputFile: "klipper.bin",
      signal: new AbortController().signal,
      log: (line) => logs.push(line),
    });

    const resolvedLine = logs.find((line) => line.startsWith("resolved="));
    expect(resolvedLine).toBeDefined();
    expect(resolvedLine).toBe("resolved=work/out/klipper.bin");
    for (const line of logs) {
      expect(line).not.toContain(buildDir);
      expect(line).not.toContain("/private/var/folders");
      expect(line).not.toContain("/var/folders");
    }
  });

  it("aborts a running build when the signal fires", async () => {
    config.klipperSourcePath = setupFakeKlipper(MAKEFILE_SLEEP);
    const buildDir = setupBuildDir();
    const controller = new AbortController();

    const runPromise = processAdapter.run({
      jobId: "test-cancel",
      buildDir,
      outputFile: "klipper.bin",
      signal: controller.signal,
      log: () => {},
    });

    setTimeout(() => controller.abort(), 200);

    await expect(runPromise).rejects.toThrow(/aborted|SIGTERM|SIGKILL/i);
  });
});
