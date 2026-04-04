import type { ConfigDocument } from "./sections/types";

export interface KlipperForgeProject {
  version: 1;
  document: ConfigDocument;
  selectedMacros: string[];
}

export function exportProject(doc: ConfigDocument): KlipperForgeProject {
  return {
    version: 1,
    document: doc,
    selectedMacros: [],
  };
}

export function importProject(json: unknown): KlipperForgeProject {
  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid project file: expected an object");
  }

  const obj = json as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(`Unsupported project version: ${obj.version}`);
  }

  if (!obj.document || typeof obj.document !== "object") {
    throw new Error("Invalid project file: missing document");
  }

  const doc = obj.document as Record<string, unknown>;
  if (!Array.isArray(doc.sections)) {
    throw new Error("Invalid project file: missing sections");
  }

  return {
    version: 1,
    document: obj.document as ConfigDocument,
    selectedMacros: Array.isArray(obj.selectedMacros) ? (obj.selectedMacros as string[]) : [],
  };
}
