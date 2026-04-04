import { type SectionRegistry, resolveHeader } from "./registry";
import type { ConfigDocument, ConfigValue, SectionInstance } from "./types";

export interface ActiveOverride {
  sourceHeader: string;
  sourceDefinitionId: string;
  overriddenValue: ConfigValue;
  originalValue: ConfigValue | undefined;
}

export type OverrideMap = Map<string, Map<string, ActiveOverride>>;

export function collectActiveOverrides(doc: ConfigDocument, registry: SectionRegistry): OverrideMap {
  const result: OverrideMap = new Map();

  // Build header→section lookup map once
  const headerMap = new Map<string, SectionInstance>();
  for (const inst of doc.sections) {
    const header = resolveHeader(inst, registry);
    if (header) headerMap.set(header, inst);
  }

  for (const instance of doc.sections) {
    if (instance.disabled) continue;
    const def = registry.get(instance.definitionId);
    if (!def?.overrides) continue;

    const sourceHeader = resolveHeader(instance, registry);
    if (!sourceHeader) continue;

    for (const override of def.overrides) {
      const target = headerMap.get(override.target);
      if (!target) continue;

      let fieldMap = result.get(override.target);
      if (!fieldMap) {
        fieldMap = new Map();
        result.set(override.target, fieldMap);
      }

      for (const [fieldName, overriddenValue] of Object.entries(override.values)) {
        fieldMap.set(fieldName, {
          sourceHeader,
          sourceDefinitionId: instance.definitionId,
          overriddenValue,
          originalValue: target.data[fieldName],
        });
      }
    }
  }

  // Second pass: SAVE_CONFIG field overlaps
  if (doc.saveConfigSections) {
    for (const saveSection of doc.saveConfigSections) {
      const fullHeader =
        saveSection.type === saveSection.name ? saveSection.type : `${saveSection.type} ${saveSection.name}`;

      const target = headerMap.get(fullHeader);
      if (!target) continue;

      const targetDef = registry.get(target.definitionId);

      for (const [fieldName, overriddenValue] of Object.entries(saveSection.values)) {
        if (!(fieldName in target.data) && !(targetDef?.params && fieldName in targetDef.params)) continue;

        let fieldMap = result.get(fullHeader);
        if (!fieldMap) {
          fieldMap = new Map();
          result.set(fullHeader, fieldMap);
        }

        fieldMap.set(fieldName, {
          sourceHeader: `#*# ${fullHeader}`,
          sourceDefinitionId: "save_config",
          overriddenValue,
          originalValue: target.data[fieldName],
        });
      }
    }
  }

  return result;
}
