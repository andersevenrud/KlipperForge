import type { ConfigValue, SectionDefinition, SectionInstance } from "./types";

export class SectionRegistry {
  private definitions = new Map<string, SectionDefinition>();

  register(def: SectionDefinition): void {
    this.definitions.set(def.id, def);
  }

  get(id: string): SectionDefinition | undefined {
    return this.definitions.get(id);
  }

  all(): SectionDefinition[] {
    return [...this.definitions.values()];
  }

  createInstance(defId: string, data: Record<string, unknown>, instanceName?: string): SectionInstance {
    const def = this.definitions.get(defId);
    if (!def) {
      throw new Error(`Unknown section definition: ${defId}`);
    }

    const result = def.schema.safeParse(data);
    const parsed = result.success ? result.data : data;
    const metaFields = new Set(def.metaFields ?? []);
    const instanceData: Record<string, ConfigValue> = {};
    const meta: Record<string, ConfigValue> = {};

    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === undefined) continue;
      if (metaFields.has(key)) {
        meta[key] = value as ConfigValue;
      } else {
        instanceData[key] = value as ConfigValue;
      }
    }

    return {
      definitionId: defId,
      instanceName,
      data: instanceData,
      meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
  }

  validate(defId: string, data: unknown) {
    const def = this.definitions.get(defId);
    if (!def) {
      throw new Error(`Unknown section definition: ${defId}`);
    }
    return def.schema.safeParse(data);
  }
}

export function resolveHeader(instance: SectionInstance, registry: SectionRegistry): string | undefined {
  const def = registry.get(instance.definitionId);
  if (!def) return undefined;

  switch (def.naming.kind) {
    case "fixed":
      return def.naming.header;
    case "suffixed":
      return `${def.naming.prefix}_${instance.instanceName}`;
    case "named":
      return `${def.naming.prefix} ${instance.instanceName}`;
    case "custom":
      return def.naming.header;
  }
}
