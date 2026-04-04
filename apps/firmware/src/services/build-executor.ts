import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Docker from "dockerode";
import { config } from "../config";
import { updateBuildStatus } from "../db/queries/builds";
import type { CachedBuildResult } from "../types";
import { isValidFilename } from "../utils/sanitize";
import { appendLog } from "./build-log";
import { storeInCache } from "./cache";

interface DockerMount {
  Type: "volume" | "bind";
  Source: string;
  Target: string;
  ReadOnly?: boolean;
}

const docker = new Docker({ socketPath: config.dockerSocket });
const activeContainers = new Map<string, Docker.Container>();

function createKlipperMount(): DockerMount {
  if (config.klipperVolumeName) {
    return { Type: "volume", Source: config.klipperVolumeName, Target: "/klipper", ReadOnly: true };
  }
  return { Type: "bind", Source: realpathSync(resolve(config.klipperSourcePath)), Target: "/klipper", ReadOnly: true };
}

function createBuildMount(buildDir: string): DockerMount {
  if (config.buildsVolumeName) {
    return { Type: "volume", Source: config.buildsVolumeName, Target: "/builds" };
  }
  return { Type: "bind", Source: buildDir, Target: "/build" };
}

export function getActiveContainers(): Map<string, Docker.Container> {
  return activeContainers;
}

export async function executeBuild(
  jobId: string,
  configContent: string,
  cacheKey: string,
  boardId: string,
  outputFile: string,
): Promise<CachedBuildResult> {
  const buildBase = config.buildsPath || tmpdir();
  const buildDir = join(buildBase, `klipperforge-build-${jobId}`);
  mkdirSync(buildDir, { recursive: true });

  // When using a shared volume, the builder container sees /builds/<dirname>
  const containerBuildPath = config.buildsVolumeName ? `/builds/klipperforge-build-${jobId}` : "/build";

  const log = (msg: string) => {
    console.log(`[build:${jobId.slice(0, 8)}] ${msg}`);
    appendLog(jobId, msg);
  };

  try {
    if (!isValidFilename(outputFile)) {
      throw new Error(`Invalid output filename: ${outputFile}`);
    }

    writeFileSync(join(buildDir, ".config"), configContent);
    log("Wrote .config file");
    updateBuildStatus(jobId, "building", { progress: "Starting container" });

    log(`Creating container (image: ${config.builderImage})`);
    const container = await docker.createContainer({
      Image: config.builderImage,
      Cmd: [
        "sh",
        "-c",
        [
          "cp -a /klipper/. /work/",
          `cp ${containerBuildPath}/.config /work/.config`,
          "cd /work",
          "make olddefconfig",
          "make -j$(nproc)",
          `cp /work/out/${outputFile} ${containerBuildPath}/`,
        ].join(" && "),
      ],
      HostConfig: {
        Mounts: [createKlipperMount(), createBuildMount(buildDir)],
        NetworkMode: "none",
        Memory: config.buildMemoryMb * 1024 * 1024,
        NanoCpus: config.buildCpus * 1_000_000_000,
        PidsLimit: 256,
        SecurityOpt: ["no-new-privileges:true"],
        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=64m",
          "/work": "rw,exec,size=512m",
        },
        AutoRemove: true,
      },
      WorkingDir: "/work",
    });

    log("Starting container");
    activeContainers.set(jobId, container);
    await container.start();
    updateBuildStatus(jobId, "building", { progress: "Compiling firmware" });

    // Stream logs from container in real-time
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    streamContainerLogs(logStream, jobId);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        log("Build timed out, killing container");
        container.kill().catch(() => {});
        reject(new Error("Build timed out"));
      }, config.buildTimeoutMs);
    });

    const waitPromise = container.wait();
    const result = (await Promise.race([waitPromise, timeoutPromise])) as {
      StatusCode: number;
    };

    if (result.StatusCode !== 0) {
      log(`Container exited with code ${result.StatusCode}`);
      throw new Error(`Build failed (exit code ${result.StatusCode})`);
    }

    log("Container exited successfully, reading output");
    const outputPath = join(buildDir, outputFile);
    const blob = new Uint8Array(readFileSync(outputPath));
    log(`Output file: ${outputFile} (${blob.length} bytes)`);

    storeInCache(cacheKey, blob, outputFile, boardId);
    log("Stored in cache");

    return { blob, filename: outputFile };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log(`Build error: ${msg}`);
    throw error;
  } finally {
    activeContainers.delete(jobId);
    rmSync(buildDir, { recursive: true, force: true });
  }
}

function streamContainerLogs(logStream: NodeJS.ReadableStream, jobId: string): void {
  let buffer = "";

  logStream.on("data", (chunk: Buffer) => {
    // Docker multiplexed stream: 8-byte header per frame
    // Byte 0: stream type (1=stdout, 2=stderr)
    // Bytes 4-7: payload size (big-endian uint32)
    let offset = 0;
    const data = Buffer.from(chunk);

    while (offset < data.length) {
      if (offset + 8 > data.length) {
        // Not enough data for header, treat remainder as raw text
        buffer += data.subarray(offset).toString("utf-8");
        break;
      }

      const payloadSize = data.readUInt32BE(offset + 4);
      if (offset + 8 + payloadSize > data.length) {
        // Partial frame, treat as raw text
        buffer += data.subarray(offset + 8).toString("utf-8");
        break;
      }

      const payload = data.subarray(offset + 8, offset + 8 + payloadSize).toString("utf-8");
      buffer += payload;
      offset += 8 + payloadSize;
    }

    // Emit complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      appendLog(jobId, line);
    }
  });

  logStream.on("end", () => {
    if (buffer) {
      appendLog(jobId, buffer);
    }
  });
}
