import { type ChildProcess, spawn } from "node:child_process";
import { copyFile, cp, realpath } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { join, resolve } from "node:path";
import { config } from "../../config";
import type { BuildAdapter, BuildRunContext } from "./types";

type Redaction = [string, string];

interface SpawnOptions {
  cwd: string;
  args: string[];
  signal: AbortSignal;
  jobId: string;
  log: (line: string) => void;
}

const SIGKILL_GRACE_MS = 2000;

const activeProcesses = new Map<string, ChildProcess>();

async function run(ctx: BuildRunContext): Promise<void> {
  const { jobId, buildDir, outputFile, signal, log } = ctx;
  const workDir = join(buildDir, "work");
  const klipperSource = resolve(config.klipperSourcePath);

  const redactions = await buildRedactions(buildDir);
  const redactedLog = (line: string) => log(redactPaths(line, redactions));

  redactedLog(`Copying Klipper source to ${workDir}`);
  await cp(klipperSource, workDir, { recursive: true, dereference: false });
  await copyFile(join(buildDir, ".config"), join(workDir, ".config"));

  const jobs = String(availableParallelism());
  await runMake({ cwd: workDir, args: ["olddefconfig"], signal, jobId, log: redactedLog });
  await runMake({ cwd: workDir, args: [`-j${jobs}`], signal, jobId, log: redactedLog });

  redactedLog(`Copying out/${outputFile} to build output directory`);
  await copyFile(join(workDir, "out", outputFile), join(buildDir, outputFile));
}

async function buildRedactions(buildDir: string): Promise<Redaction[]> {
  const canonical = await realpath(buildDir).catch(() => buildDir);
  const dirs = canonical === buildDir ? [buildDir] : [canonical, buildDir];
  const pairs: Redaction[] = [];
  for (const dir of dirs) {
    pairs.push([`${dir}/`, ""]);
    pairs.push([dir, "."]);
  }
  return pairs.sort(([a], [b]) => b.length - a.length);
}

function redactPaths(line: string, redactions: Redaction[]): string {
  let out = line;
  for (const [from, to] of redactions) {
    if (out.includes(from)) {
      out = out.replaceAll(from, to);
    }
  }
  return out;
}

async function runMake(options: SpawnOptions): Promise<void> {
  const { cwd, args, signal, jobId, log } = options;

  if (signal.aborted) {
    throw new Error("Build aborted");
  }

  log(`Running: make ${args.join(" ")}`);
  const child = spawn("make", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, MAKEFLAGS: "" },
  });

  activeProcesses.set(jobId, child);

  const onAbort = () => {
    log("Abort received, sending SIGTERM");
    child.kill("SIGTERM");
    const killTimer = setTimeout(() => {
      if (child.exitCode === null && !child.killed) {
        log("Process still alive, sending SIGKILL");
        child.kill("SIGKILL");
      }
    }, SIGKILL_GRACE_MS);
    killTimer.unref();
  };
  signal.addEventListener("abort", onAbort, { once: true });

  const stdoutPromise = child.stdout ? streamToLog(child.stdout, log) : Promise.resolve();
  const stderrPromise = child.stderr ? streamToLog(child.stderr, log) : Promise.resolve();

  try {
    const [exitCode, exitSignal] = await waitForExit(child);
    await Promise.allSettled([stdoutPromise, stderrPromise]);

    if (signal.aborted) {
      throw new Error("Build aborted");
    }
    if (exitCode === null) {
      throw new Error(`Build failed (terminated by ${exitSignal ?? "unknown signal"})`);
    }
    if (exitCode !== 0) {
      throw new Error(`Build failed (exit code ${exitCode})`);
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    activeProcesses.delete(jobId);
  }
}

function waitForExit(child: ChildProcess): Promise<[number | null, NodeJS.Signals | null]> {
  return new Promise((resolvePromise, rejectPromise) => {
    child.once("exit", (code, killSignal) => resolvePromise([code, killSignal]));
    child.once("error", (err) => rejectPromise(err));
  });
}

async function streamToLog(stream: NodeJS.ReadableStream, log: (line: string) => void): Promise<void> {
  let buffer = "";
  stream.setEncoding("utf-8");
  for await (const chunk of stream) {
    buffer += chunk as string;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) log(line);
  }
  if (buffer) log(buffer);
}

async function cancelAll(): Promise<void> {
  if (activeProcesses.size === 0) return;
  console.log(`Killing ${activeProcesses.size} active build process(es)...`);
  for (const [jobId, child] of activeProcesses) {
    try {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (child.exitCode === null && !child.killed) {
          child.kill("SIGKILL");
        }
      }, SIGKILL_GRACE_MS).unref();
    } catch (err) {
      console.warn(`Failed to kill process for ${jobId.slice(0, 8)}: ${err instanceof Error ? err.message : err}`);
    }
  }
}

export const processAdapter: BuildAdapter = {
  kind: "process",
  run,
  cancelAll,
};
