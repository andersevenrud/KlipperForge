import { config } from "../../config";
import { dockerAdapter } from "./docker-adapter";
import { processAdapter } from "./process-adapter";
import type { BuildAdapter } from "./types";

let instance: BuildAdapter | null = null;

export function getBuildAdapter(): BuildAdapter {
  if (instance) return instance;
  switch (config.buildAdapter) {
    case "docker":
      instance = dockerAdapter;
      return instance;
    case "process":
      instance = processAdapter;
      return instance;
  }
}
