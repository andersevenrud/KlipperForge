import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import Docker from "dockerode";
import { config } from "../../config";
import type { BuildAdapter, BuildRunContext } from "./types";

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
  return {
    Type: "bind",
    Source: realpathSync(resolve(config.klipperSourcePath)),
    Target: "/klipper",
    ReadOnly: true,
  };
}

function createBuildMount(buildDir: string): DockerMount {
  if (config.buildsVolumeName) {
    return { Type: "volume", Source: config.buildsVolumeName, Target: "/builds" };
  }
  return { Type: "bind", Source: buildDir, Target: "/build" };
}

function containerBuildPath(jobId: string): string {
  return config.buildsVolumeName ? `/builds/klipperforge-build-${jobId}` : "/build";
}

async function run(ctx: BuildRunContext): Promise<void> {
  const { jobId, buildDir, outputFile, signal, log } = ctx;
  const mountPath = containerBuildPath(jobId);

  log(`Creating container (image: ${config.builderImage})`);
  const container = await docker.createContainer({
    Image: config.builderImage,
    Cmd: [
      "sh",
      "-c",
      [
        "cp -a /klipper/. /work/",
        `cp ${mountPath}/.config /work/.config`,
        "cd /work",
        "make olddefconfig",
        "make -j$(nproc)",
        `cp /work/out/${outputFile} ${mountPath}/`,
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

  const onAbort = () => {
    log("Abort received, killing container");
    container.kill().catch(() => {});
  };
  signal.addEventListener("abort", onAbort, { once: true });

  try {
    await container.start();

    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });
    streamContainerLogs(logStream, log);

    const result = (await container.wait()) as { StatusCode: number };

    if (signal.aborted) {
      throw new Error("Build aborted");
    }

    if (result.StatusCode !== 0) {
      log(`Container exited with code ${result.StatusCode}`);
      throw new Error(`Build failed (exit code ${result.StatusCode})`);
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    activeContainers.delete(jobId);
  }
}

async function cancelAll(): Promise<void> {
  if (activeContainers.size === 0) return;
  console.log(`Killing ${activeContainers.size} active build container(s)...`);
  await Promise.allSettled(
    [...activeContainers.entries()].map(([jobId, container]) =>
      container.kill().catch((err: unknown) => {
        console.warn(`Failed to kill container for ${jobId.slice(0, 8)}: ${err instanceof Error ? err.message : err}`);
      }),
    ),
  );
}

function streamContainerLogs(logStream: NodeJS.ReadableStream, log: (line: string) => void): void {
  let buffer = "";

  logStream.on("data", (chunk: Buffer) => {
    // Docker multiplexed stream: 8-byte header per frame
    // Byte 0: stream type (1=stdout, 2=stderr)
    // Bytes 4-7: payload size (big-endian uint32)
    let offset = 0;
    const data = Buffer.from(chunk);

    while (offset < data.length) {
      if (offset + 8 > data.length) {
        buffer += data.subarray(offset).toString("utf-8");
        break;
      }

      const payloadSize = data.readUInt32BE(offset + 4);
      if (offset + 8 + payloadSize > data.length) {
        buffer += data.subarray(offset + 8).toString("utf-8");
        break;
      }

      const payload = data.subarray(offset + 8, offset + 8 + payloadSize).toString("utf-8");
      buffer += payload;
      offset += 8 + payloadSize;
    }

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      log(line);
    }
  });

  logStream.on("end", () => {
    if (buffer) {
      log(buffer);
    }
  });
}

export const dockerAdapter: BuildAdapter = {
  kind: "docker",
  run,
  cancelAll,
};
