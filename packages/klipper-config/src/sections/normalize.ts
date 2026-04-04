import { applyControlVisibility, applyFieldGroups, applySensorTypeVisibility } from "./field-groups";
import type { ParamDefinition, SectionParams } from "./param-types";
import { getSectionModeConfig } from "./section-modes";
import type { ConfigValue, SectionDefinition } from "./types";

export interface NormalizeSectionOptions {
  definition: SectionDefinition;
  overriddenFields?: Set<string>;
}

export interface NormalizeSectionResult {
  data: Record<string, ConfigValue>;
  meta: Record<string, ConfigValue> | undefined;
}

/**
 * Applies the full visibility chain (field groups, control, sensor type)
 * and returns resolved param entries for the given section.
 */
function resolveParams(params: SectionParams, definitionId: string): [string, ParamDefinition][] {
  const entries = Object.entries(params) as [string, ParamDefinition][];
  return applySensorTypeVisibility(applyControlVisibility(applyFieldGroups(entries, definitionId)));
}

/**
 * Returns a map of field names that should be hidden given the current data
 * and optional section mode. Values are human-readable reasons explaining
 * why the field is hidden.
 */
export function computeHiddenFields(
  params: SectionParams,
  definitionId: string,
  data: Record<string, unknown>,
  mode?: string,
): Map<string, string> {
  const hidden = new Map<string, string>();
  const resolved = resolveParams(params, definitionId);

  for (const [name, param] of resolved) {
    if (param.visibleWhen) {
      const watched = data[param.visibleWhen.field];
      if (watched != null && watched !== param.visibleWhen.value) {
        hidden.set(
          name,
          `"${name}" is set but has no effect because "${param.visibleWhen.field}" is not "${param.visibleWhen.value}"`,
        );
      }
    }

    if (param.hiddenWhen) {
      const watched = data[param.hiddenWhen.field];
      if (watched != null && watched === param.hiddenWhen.value) {
        hidden.set(
          name,
          `"${name}" is set but has no effect because "${param.hiddenWhen.field}" is "${param.hiddenWhen.value}"`,
        );
      }
    }
  }

  if (mode !== undefined) {
    const modeConfig = getSectionModeConfig(definitionId);
    if (modeConfig) {
      const modeHidden = modeConfig.getHiddenFields(mode);
      for (const field of modeHidden) {
        if (!hidden.has(field)) {
          hidden.set(field, `"${field}" is set but has no effect in ${mode.toUpperCase()} mode`);
        }
      }
    }
  }

  return hidden;
}

/**
 * Normalizes raw section form data by removing empty values, separating
 * meta fields, and dropping overridden fields. Visibility-hidden fields
 * are preserved in the data store — filtering is deferred to the serializer.
 */
export function normalizeSectionData(
  raw: Record<string, unknown>,
  options: NormalizeSectionOptions,
): NormalizeSectionResult {
  const { definition, overriddenFields } = options;
  const metaFields = new Set(definition.metaFields ?? []);

  const multilineFields = new Set<string>();
  if (definition.params) {
    for (const [key, param] of Object.entries(definition.params)) {
      if (param.type.kind === "multiline") {
        multilineFields.add(key);
      }
    }
  }

  const data: Record<string, ConfigValue> = {};
  const meta: Record<string, ConfigValue> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;
    if (value === "" && !multilineFields.has(key)) continue;
    if (metaFields.has(key)) {
      meta[key] = value as ConfigValue;
      continue;
    }
    if (overriddenFields?.has(key)) continue;
    data[key] = value as ConfigValue;
  }

  return {
    data,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
}
