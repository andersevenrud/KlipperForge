import { zodResolver } from "@hookform/resolvers/zod";
import {
  applyControlVisibility,
  applyFieldGroups,
  applySensorTypeVisibility,
  computeHiddenFields,
  defaultRegistry,
  type FieldGroup,
  getFieldGroup,
  getSectionModeConfig,
  isBoardPinsSection,
  isTmcSection,
  KNOWN_SENSOR_TYPES,
  normalizeSectionData,
  parsePinAliasString,
  type SectionInstance,
} from "@klipperforge/klipper-config";
import type { ParamDefinition } from "@klipperforge/klipper-config/sections/param-types";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { type ZodTypeAny, z } from "zod";
import { KeyValueEditor, type KeyValueEntry } from "@/components/sections/KeyValueEditor";
import { VariableEditor } from "@/components/sections/VariableEditor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveHeader, useConfig } from "@/context/config-context";
import type { TimerId } from "@/types";
import { BooleanSelect } from "./BooleanSelect";
import { ParamField } from "./ParamField";
import { getFieldType, numericSetValueAs, unwrapType } from "./section-editor-utils";

interface SectionEditorProps {
  section: SectionInstance;
  header: string;
}

interface ZodShape {
  shape: Record<string, ZodTypeAny>;
}

type Segment =
  | { type: "fields"; entries: [string, ParamDefinition][] }
  | { type: "group"; label: string; entries: [string, ParamDefinition][] };

export function SectionEditor({ section, header }: SectionEditorProps) {
  const { state, dispatch } = useConfig();
  const definition = defaultRegistry.get(section.definitionId);

  const isTmc = isTmcSection(section.definitionId);
  const [driverParamsOpen, setDriverParamsOpen] = useState(false);

  const modeConfig = useMemo(() => getSectionModeConfig(section.definitionId), [section.definitionId]);
  const [mode, setMode] = useState<string>(
    () => (section.meta?._mode as string) ?? modeConfig?.detect(section.data) ?? "",
  );

  const fieldOverrides = useMemo(() => state.overrideMap.get(header), [state.overrideMap, header]);

  const overrideValues = useMemo(() => {
    if (!fieldOverrides) return {};
    const vals: Record<string, unknown> = {};
    for (const [key, override] of fieldOverrides) {
      vals[key] = override.overriddenValue;
    }
    return vals;
  }, [fieldOverrides]);

  const {
    register,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    // biome-ignore lint/suspicious/noExplicitAny: Zod 4 compat layer type mismatch with zodResolver
    resolver: zodResolver((definition?.schema ?? z.object({}).passthrough()) as any),
    mode: "onChange",
    defaultValues: { ...section.data, ...section.meta, ...overrideValues } as Record<string, unknown>,
  });

  const formValues = watch();

  // Track visibleWhen-watched field values via explicit state so that
  // changes always trigger a re-render and re-filter.
  const [visibilityDeps, setVisibilityDeps] = useState<Record<string, unknown>>(() => {
    const deps: Record<string, unknown> = {};
    if (definition?.params) {
      // Use resolved params so dynamically-injected visibleWhen/hiddenWhen rules
      // (e.g. PID fields conditioned on control) are tracked from the start.
      const entries = Object.entries(definition.params) as [string, ParamDefinition][];
      const resolved = applySensorTypeVisibility(
        applyControlVisibility(applyFieldGroups(entries, section.definitionId)),
      );
      for (const [, param] of resolved) {
        if (param.visibleWhen) deps[param.visibleWhen.field] = section.data[param.visibleWhen.field];
        if (param.hiddenWhen) deps[param.hiddenWhen.field] = section.data[param.hiddenWhen.field];
      }
    }
    return deps;
  });

  useEffect(
    function trackVisibilityFieldsEffect() {
      const subscription = watch((values) => {
        setVisibilityDeps((prev) => {
          const watchedFields = new Set<string>();
          for (const [, param] of fieldsRef.current as [string, ParamDefinition][]) {
            if (param.visibleWhen) watchedFields.add(param.visibleWhen.field);
            if (param.hiddenWhen) watchedFields.add(param.hiddenWhen.field);
          }
          const next: Record<string, unknown> = {};
          for (const field of watchedFields) {
            next[field] = values[field];
          }
          const changed =
            Object.keys(next).some((k) => prev[k] !== next[k]) || Object.keys(prev).length !== Object.keys(next).length;
          return changed ? next : prev;
        });
      });
      return () => subscription.unsubscribe();
    },
    [watch],
  );

  const isBoardPins = isBoardPinsSection(section.definitionId);

  const initialAliasEntries = useMemo(() => {
    if (!isBoardPins) return [];
    const entries: KeyValueEntry[] = [];
    for (const [key, value] of Object.entries(section.data)) {
      if ((key === "aliases" || key.startsWith("aliases_")) && typeof value === "string") {
        const parsed = parsePinAliasString(value);
        for (const [name, pin] of Object.entries(parsed)) {
          entries.push({ key: name, value: pin });
        }
      }
    }
    return entries;
  }, [isBoardPins, section.data]);

  const [aliasEntries, setAliasEntries] = useState<KeyValueEntry[]>(initialAliasEntries);
  const aliasEntriesRef = useRef(aliasEntries);
  aliasEntriesRef.current = aliasEntries;

  const initialVariables = useMemo(() => {
    const vars: Record<string, import("@klipperforge/klipper-config").ConfigValue> = {};
    for (const [key, value] of Object.entries(section.data)) {
      if (key.startsWith("variable_")) {
        vars[key] = value;
      }
    }
    return vars;
  }, [section.data]);

  const [variables, setVariables] = useState(initialVariables);
  const variablesRef = useRef(variables);
  variablesRef.current = variables;

  const lastDispatchedRef = useRef<string>(JSON.stringify(section.data));
  const lastModeRef = useRef<string>(mode);
  const debounceRef = useRef<TimerId | null>(null);
  const dispatchDataRef = useRef<(formValues: Record<string, unknown>) => void>(() => {});

  const handleAliasEntriesChange = useCallback(
    (updated: KeyValueEntry[]) => {
      setAliasEntries(updated);
      aliasEntriesRef.current = updated;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatchDataRef.current(watch());
      }, 80);
    },
    [watch],
  );

  const handleVariablesChange = useCallback(
    (updated: Record<string, import("@klipperforge/klipper-config").ConfigValue>) => {
      setVariables(updated);
      variablesRef.current = updated;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatchDataRef.current(watch());
      }, 80);
    },
    [watch],
  );

  const { fieldWarnings, fieldErrors, sectionErrors } = useMemo(() => {
    const warnings = new Map<string, string>();
    const errors = new Map<string, string>();
    const sectionLevel: string[] = [];
    for (const error of state.validationErrors) {
      if (error.section === header && error.field) {
        if (error.severity === "warning") {
          warnings.set(error.field, error.message);
        } else if (error.severity !== "info") {
          errors.set(error.field, error.message);
        }
      } else if (
        error.section === header &&
        !error.field &&
        error.severity !== "warning" &&
        error.severity !== "info"
      ) {
        sectionLevel.push(error.message);
      }
    }
    return { fieldWarnings: warnings, fieldErrors: errors, sectionErrors: sectionLevel };
  }, [state.validationErrors, header]);

  // Collect MCU names for board_pins mcu dropdown
  const mcuChoices = useMemo(() => {
    return state.document.sections
      .filter((s) => s.definitionId === "mcu_named")
      .map((s) => s.instanceName)
      .filter((n): n is string => !!n);
  }, [state.document.sections]);

  // Augment sensor_type choices with custom thermistor names from config
  const sensorTypeChoices = useMemo(() => {
    const customNames = state.document.sections
      .filter((s) => s.definitionId === "thermistor" || s.definitionId === "adc_temperature")
      .map((s) => s.instanceName)
      .filter((n): n is string => !!n);
    if (customNames.length === 0) return KNOWN_SENSOR_TYPES;
    return [...KNOWN_SENSOR_TYPES, ...customNames];
  }, [state.document.sections]);

  // Collect temperature-reporting section names for sensor_list multiselect
  const temperatureSensorNames = useMemo(() => {
    const tempSectionIds = new Set([
      "extruder",
      "heater_bed",
      "heater_generic",
      "temperature_sensor",
      "temperature_fan",
      "temperature_probe",
    ]);
    return state.document.sections
      .filter((s) => tempSectionIds.has(s.definitionId))
      .map((s) => resolveHeader(s))
      .filter((h) => h !== header);
  }, [state.document.sections, header]);

  const metaFieldSet = useMemo(() => new Set(definition?.metaFields ?? []), [definition?.metaFields]);

  const hasParams = !!definition?.params;

  // Build field list from params metadata if available, else from Zod schema
  const fields = useMemo(() => {
    if (!definition) return [];

    if (definition.params) {
      const entries = Object.entries(definition.params)
        .filter(([name]) => !metaFieldSet.has(name))
        .filter(([name]) => !isBoardPins || (name !== "aliases" && !name.startsWith("aliases_")))
        .sort(([, a], [, b]) => {
          // Required fields first
          if (a.required !== b.required) return a.required ? -1 : 1;
          return 0;
        });
      return applySensorTypeVisibility(applyControlVisibility(applyFieldGroups(entries, section.definitionId)));
    }

    const shape = (definition.schema as unknown as ZodShape).shape;
    return Object.entries(shape).filter(([name]) => !metaFieldSet.has(name));
  }, [definition, metaFieldSet, section.definitionId, isBoardPins]);

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  // All hidden fields (visibility rules + section mode)
  const hiddenFieldMap = useMemo(() => {
    if (!hasParams || !definition?.params) return new Map<string, string>();
    return computeHiddenFields(definition.params, definition.id, visibilityDeps, mode || undefined);
  }, [hasParams, definition, visibilityDeps, mode]);

  // Filter fields: visibleWhen + hiddenWhen + section mode
  const visibleFields = useMemo(() => {
    if (!hasParams) return fields;
    return (fields as [string, ParamDefinition][]).filter(([name]) => !hiddenFieldMap.has(name));
  }, [fields, hasParams, hiddenFieldMap]);

  // Warnings for fields whose visibleWhen dependency is unset (e.g. pid fields when control is None)
  const indeterminateWarnings = useMemo(() => {
    const warnings = new Map<string, string>();
    if (!hasParams) return warnings;
    for (const [name, param] of fields as [string, ParamDefinition][]) {
      if (param.visibleWhen) {
        const watched = visibilityDeps[param.visibleWhen.field];
        const value = formValues[name];
        if (watched == null && value != null && value !== "") {
          warnings.set(name, `Requires "${param.visibleWhen.field}" set to "${param.visibleWhen.value}"`);
        }
      }
    }
    return warnings;
  }, [fields, hasParams, visibilityDeps, formValues]);

  // Split TMC fields into main and driver_* groups
  const { mainFields, driverFields } = useMemo(() => {
    if (!isTmc || !hasParams) {
      return { mainFields: visibleFields, driverFields: [] };
    }
    const main: [string, ParamDefinition][] = [];
    const driver: [string, ParamDefinition][] = [];
    for (const entry of visibleFields as [string, ParamDefinition][]) {
      if (entry[0].startsWith("driver_")) {
        driver.push(entry);
      } else {
        main.push(entry);
      }
    }
    return { mainFields: main, driverFields: driver };
  }, [isTmc, hasParams, visibleFields]);

  // Segment mainFields into group runs and solo runs for visual grouping
  const mainSegments = useMemo(() => {
    const segments: Segment[] = [];
    let currentGroup: FieldGroup | undefined;
    let currentEntries: [string, ParamDefinition][] = [];

    for (const entry of mainFields as [string, ParamDefinition][]) {
      const group = hasParams ? getFieldGroup(entry[0], section.definitionId) : undefined;

      if (group !== currentGroup) {
        if (currentEntries.length > 0) {
          segments.push(
            currentGroup
              ? { type: "group", label: currentGroup.label, entries: currentEntries }
              : { type: "fields", entries: currentEntries },
          );
        }
        currentGroup = group;
        currentEntries = [entry];
      } else {
        currentEntries.push(entry);
      }
    }

    if (currentEntries.length > 0) {
      segments.push(
        currentGroup
          ? { type: "group", label: currentGroup.label, entries: currentEntries }
          : { type: "fields", entries: currentEntries },
      );
    }

    return segments;
  }, [mainFields, hasParams, section.definitionId]);

  // Driver fields that have values set (shown even when collapsed)
  const driverFieldsWithValues = useMemo(() => {
    if (!isTmc) return [];
    return (driverFields as [string, ParamDefinition][]).filter(([name]) => {
      const val = formValues[name];
      return val !== undefined && val !== "";
    });
  }, [isTmc, driverFields, formValues]);

  // Collect warnings for fields that are currently hidden but have values set
  const hiddenFieldWarnings = useMemo(() => {
    const visibleFieldNames = new Set((visibleFields as [string, unknown][]).map(([name]) => name));
    return state.validationErrors.filter(
      (e) => e.section === header && e.field && e.severity === "warning" && !visibleFieldNames.has(e.field),
    );
  }, [state.validationErrors, header, visibleFields]);

  const isGcodeMacro = section.definitionId === "gcode_macro";

  useEffect(
    function syncAliasEntriesEffect() {
      setAliasEntries(initialAliasEntries);
    },
    [initialAliasEntries],
  );

  // Sync variables when section data changes externally (e.g. import)
  useEffect(
    function syncVariablesEffect() {
      setVariables(initialVariables);
    },
    [initialVariables],
  );

  useEffect(
    function watchAndDispatchEffect() {
      if (!definition) return;

      const dispatchData = (formValues: Record<string, unknown>) => {
        // Strip section-specific fields before normalization
        const filtered: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(formValues)) {
          if (key === "_mode") continue;
          if (key.startsWith("variable_")) continue;
          if (isBoardPins && (key === "aliases" || key.startsWith("aliases_"))) continue;
          filtered[key] = value;
        }

        const { data } = normalizeSectionData(filtered, {
          definition,
        });

        // Section-specific: merge macro variables
        if (isGcodeMacro) {
          Object.assign(data, variablesRef.current);
        }
        // Section-specific: merge board_pins aliases
        if (isBoardPins) {
          const currentAliases = aliasEntriesRef.current;
          if (currentAliases.length > 0) {
            data.aliases = currentAliases
              .filter((e) => e.key && e.value)
              .map((e) => `${e.key}=${e.value}`)
              .join(",\n");
          }
        }

        const serialized = JSON.stringify(data);
        const modeChanged = modeConfig && mode !== lastModeRef.current;
        if (serialized === lastDispatchedRef.current && !modeChanged) return;
        lastDispatchedRef.current = serialized;
        lastModeRef.current = mode;
        dispatch({
          type: "SET_SECTION",
          payload: {
            definitionId: section.definitionId,
            instanceName: section.instanceName,
            data,
            meta: modeConfig ? { ...section.meta, _mode: mode } : section.meta,
          },
        });
      };

      dispatchDataRef.current = dispatchData;

      // Dispatch immediately when hidden fields change (e.g. mode switch)
      dispatchData(watch());

      const subscription = watch((formValues) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => dispatchData(formValues), 80);
      });
      return () => {
        subscription.unsubscribe();
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    },
    [
      watch,
      dispatch,
      definition,
      section.definitionId,
      section.instanceName,
      section.meta,
      mode,
      modeConfig,
      isGcodeMacro,
      isBoardPins,
    ],
  );

  useEffect(
    function syncExternalDataEffect() {
      const serialized = JSON.stringify(section.data);
      if (serialized !== lastDispatchedRef.current) {
        lastDispatchedRef.current = serialized;
        reset({ ...section.data, ...section.meta, ...overrideValues }, { keepDirty: false });
        if (modeConfig) {
          setMode((section.meta?._mode as string) ?? modeConfig.detect(section.data));
        }
      }
    },
    [section.data, section.meta, overrideValues, reset, modeConfig],
  );

  if (!definition) return null;

  const renderParamField = (name: string, schemaOrParam: ParamDefinition | ZodTypeAny) => {
    const fieldError = errors[name];

    if (hasParams) {
      const param = schemaOrParam as ParamDefinition;
      let effectiveParam = param;
      if (name === "sensor_type" && param.type.kind === "choice") {
        effectiveParam = { ...param, type: { ...param.type, choices: sensorTypeChoices } };
      } else if (name === "mcu" && isBoardPins && mcuChoices.length > 0) {
        effectiveParam = {
          ...param,
          type: { kind: "choice" as const, choices: mcuChoices },
        };
      }
      return (
        <ParamField
          key={name}
          name={name}
          param={effectiveParam}
          header={header}
          control={control}
          register={register}
          value={formValues[name]}
          error={fieldError?.message as string | undefined}
          warning={fieldWarnings.get(name) ?? indeterminateWarnings.get(name)}
          validationError={fieldErrors.get(name)}
          override={fieldOverrides?.get(name)}
          listChoices={name === "sensor_list" ? temperatureSensorNames : undefined}
        />
      );
    }

    // Legacy Zod introspection path
    const schema = schemaOrParam as ZodTypeAny;
    const { inner, optional } = unwrapType(schema);
    const fieldType = getFieldType(inner);
    return (
      <div key={name} className="flex flex-col gap-1" data-field-id={`${header}-${name}`}>
        <FieldWrapper name={name} required={!optional} error={fieldError?.message as string | undefined}>
          {({ id }) =>
            fieldType === "boolean" ? (
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <BooleanSelect id={id} value={field.value as boolean | null | undefined} onChange={field.onChange} />
                )}
              />
            ) : (
              <Input
                id={id}
                type="text"
                inputMode={fieldType === "number" ? "decimal" : undefined}
                className="h-7 text-xs"
                {...register(name, fieldType === "number" ? { setValueAs: numericSetValueAs } : {})}
              />
            )
          }
        </FieldWrapper>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      {modeConfig && modeConfig.modes.length > 1 && (
        <div className="flex flex-col gap-1">
          <FieldWrapper name={modeConfig.label}>
            {({ id }) => (
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id={id} className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modeConfig.modes.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FieldWrapper>
        </div>
      )}

      {sectionErrors.length > 0 && (
        <div className="flex gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-400">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="flex flex-col gap-0.5">
            {sectionErrors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {hiddenFieldWarnings.length > 0 && (
        <div className="flex gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-700 dark:text-yellow-400">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <ul className="flex flex-col gap-0.5">
            {hiddenFieldWarnings.map((w) => (
              <li key={w.field}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {mainSegments.map((segment, _i) =>
        segment.type === "group" ? (
          <div key={segment.label} className="rounded-md border border-border/50 bg-muted/20 p-2">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {segment.label}
            </p>
            <div className="flex flex-col gap-2">
              {segment.entries.map(([name, param]) => renderParamField(name, param))}
            </div>
          </div>
        ) : (
          segment.entries.map(([name, schemaOrParam]) => renderParamField(name, schemaOrParam))
        ),
      )}

      {isGcodeMacro && <VariableEditor header={header} variables={variables} onChange={handleVariablesChange} />}

      {isBoardPins && (
        <KeyValueEditor
          label="Pin Aliases"
          header={header}
          entries={aliasEntries}
          onChange={handleAliasEntriesChange}
          keyPlaceholder="alias name"
          valuePlaceholder="physical pin"
          addLabel="Add Alias"
        />
      )}

      {driverFields.length > 0 && (
        <Collapsible open={driverParamsOpen} onOpenChange={setDriverParamsOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-md bg-muted/30 px-2 py-1.5 text-xs font-medium hover:bg-muted">
            <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${driverParamsOpen ? "rotate-90" : ""}`} />
            Driver Register Tuning
            <span className="ml-auto text-muted-foreground">{driverFields.length} params</span>
          </CollapsibleTrigger>

          {!driverParamsOpen && driverFieldsWithValues.length > 0 && (
            <div className="mt-1 flex flex-col gap-2">
              {driverFieldsWithValues.map(([name, param]) => renderParamField(name, param))}
            </div>
          )}

          <CollapsibleContent className="mt-1 flex flex-col gap-2">
            {driverFields.map(([name, param]) => renderParamField(name, param))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
