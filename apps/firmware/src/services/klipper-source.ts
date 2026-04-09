import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { config } from "../config";

interface KlipperVersionInfo {
  commit: string;
  commitShort: string;
  commitDate: string | null;
  version: string | null;
  sourceDate: string;
}

let currentCommit: string | null = null;
let versionInfo: KlipperVersionInfo | null = null;

export async function ensureKlipperSource(): Promise<void> {
  const srcPath = config.klipperSourcePath;

  if (!existsSync(join(srcPath, ".git"))) {
    throw new Error(
      `Klipper source not found at ${srcPath}. Mount a volume with a Klipper git clone, e.g.: git clone --depth=1 https://github.com/Klipper3d/klipper.git`,
    );
  }

  refreshVersionInfo();
}

function resolveHead(gitDir: string): { sha: string; refPath: string | null } {
  let head = readFileSync(join(gitDir, "HEAD"), "utf-8").trim();
  let refPath: string | null = null;
  if (head.startsWith("ref: ")) {
    const ref = head.slice(5);
    refPath = join(gitDir, ref);
    head = readFileSync(refPath, "utf-8").trim();
  }
  return { sha: head, refPath };
}

function readCommitDate(gitDir: string, sha: string): string | null {
  const objPath = join(gitDir, "objects", sha.slice(0, 2), sha.slice(2));
  if (!existsSync(objPath)) return null;
  try {
    const data = inflateSync(readFileSync(objPath)).toString("utf-8");
    const match = data.match(/^committer .+ (\d+) ([+-]\d{4})$/m);
    if (match) {
      return new Date(Number(match[1]) * 1000).toISOString();
    }
  } catch {
    // packed or corrupt object
  }
  return null;
}

function findVersionTag(gitDir: string, sha: string): string | null {
  const packedRefsPath = join(gitDir, "packed-refs");
  if (existsSync(packedRefsPath)) {
    for (const line of readFileSync(packedRefsPath, "utf-8").split("\n")) {
      if (line.startsWith("#") || line.startsWith("^")) continue;
      const parts = line.split(" ");
      if (parts[0] === sha && parts[1]?.startsWith("refs/tags/")) {
        return parts[1].replace("refs/tags/", "");
      }
    }
  }

  const tagsDir = join(gitDir, "refs/tags");
  if (existsSync(tagsDir)) {
    for (const tag of readdirSync(tagsDir)) {
      try {
        if (readFileSync(join(tagsDir, tag), "utf-8").trim() === sha) return tag;
      } catch {
        // skip unreadable
      }
    }
  }

  return null;
}

function refreshVersionInfo(): void {
  const gitDir = join(config.klipperSourcePath, ".git");
  const { sha, refPath } = resolveHead(gitDir);
  currentCommit = sha;

  const commitDate = readCommitDate(gitDir, sha);
  const version = findVersionTag(gitDir, sha);

  let sourceDate: string;
  if (refPath && existsSync(refPath)) {
    sourceDate = statSync(refPath).mtime.toISOString();
  } else {
    sourceDate = statSync(join(gitDir, "HEAD")).mtime.toISOString();
  }

  versionInfo = {
    commit: sha,
    commitShort: sha.slice(0, 8),
    commitDate,
    version,
    sourceDate,
  };

  console.log(
    `Klipper: ${version ?? sha.slice(0, 8)} (commit date: ${commitDate ?? "unknown"}, pulled: ${sourceDate})`,
  );
}

export function getKlipperCommit(): string | null {
  return currentCommit;
}

export function getKlipperVersionInfo(): KlipperVersionInfo | null {
  return versionInfo;
}
