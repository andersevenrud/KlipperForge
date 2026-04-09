import { GcodeEditor, useEditorScroll } from "@klipperforge/editor";
import type { ActiveOverride } from "@klipperforge/klipper-config";
import type { ParamDefinition } from "@klipperforge/klipper-config/sections/param-types";
import { type Control, Controller, type UseFormRegister } from "react-hook-form";
import { PinSelect } from "@/components/sections/PinSelect";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListMultiSelect } from "./ListMultiSelect";
import { formatPlaceholder, isPinField, numericSetValueAs } from "./section-editor-utils";

interface ParamFieldProps {
  name: string;
  param: ParamDefinition;
  header: string;
  control: Control<Record<string, unknown>>;
  register: UseFormRegister<Record<string, unknown>>;
  value?: unknown;
  error?: string;
  warning?: string;
  validationError?: string;
  override?: ActiveOverride;
  listChoices?: string[];
}

export function ParamField({
  name,
  param,
  header,
  control,
  register,
  value,
  error,
  warning,
  validationError,
  override,
  listChoices,
}: ParamFieldProps) {
  const { type } = param;
  const { scrollToField } = useEditorScroll();
  const placeholder = formatPlaceholder(param.default);
  const matchesDefault =
    value !== undefined && value !== null && value !== "" && param.default !== undefined && value === param.default;

  return (
    <div
      className="flex flex-col gap-1"
      data-field-id={`${header}-${name}`}
      onFocus={() => scrollToField(header, name)}
    >
      <FieldWrapper
        name={name}
        disabled={!!override}
        required={param.required}
        description={param.description}
        error={error}
        validationError={validationError}
        warning={warning}
        matchesDefault={matchesDefault}
        override={override}
      >
        {({ id, disabled }) =>
          type.kind === "boolean" ? (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Select
                  disabled={disabled}
                  value={field.value === true ? "True" : field.value === false ? "False" : "__unset__"}
                  onValueChange={(v) => field.onChange(v === "True" ? true : v === "False" ? false : null)}
                >
                  <SelectTrigger id={id} className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unset__" className="text-xs text-muted-foreground">
                      —
                    </SelectItem>
                    <SelectItem value="True" className="text-xs">
                      True
                    </SelectItem>
                    <SelectItem value="False" className="text-xs">
                      False
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          ) : type.kind === "choice" ? (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <Select
                  disabled={disabled}
                  value={field.value != null ? String(field.value) : "__none__"}
                  onValueChange={(v) => {
                    if (v === "__none__") {
                      field.onChange(null);
                    } else {
                      const asNum = Number(v);
                      field.onChange(
                        type.choices.every((c) => !Number.isNaN(Number(c))) && !Number.isNaN(asNum) ? asNum : v,
                      );
                    }
                  }}
                >
                  <SelectTrigger id={id} className="h-7 text-xs">
                    <SelectValue placeholder={placeholder ? `Default: ${placeholder}` : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {!param.required && (
                      <SelectItem value="__none__" className="text-xs text-muted-foreground">
                        None
                      </SelectItem>
                    )}
                    {type.choices.map((choice) => (
                      <SelectItem key={choice} value={choice} className="text-xs">
                        {choice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ) : type.kind === "multiline" ? (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <GcodeEditor
                  id={id}
                  disabled={!!disabled}
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          ) : type.kind === "number" ? (
            <Input
              id={id}
              type="text"
              disabled={disabled}
              inputMode={type.integer ? "numeric" : "decimal"}
              placeholder={placeholder}
              className="h-7 text-xs placeholder:text-muted-foreground/50"
              {...register(name, { setValueAs: numericSetValueAs })}
            />
          ) : type.kind === "list" && listChoices ? (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <ListMultiSelect
                  id={id}
                  disabled={!!disabled}
                  choices={listChoices}
                  value={(field.value as string) ?? ""}
                  separator={type.separator ?? ","}
                  onChange={field.onChange}
                />
              )}
            />
          ) : isPinField(name) ? (
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <PinSelect
                  id={id}
                  disabled={disabled}
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          ) : (
            <Input
              id={id}
              type="text"
              disabled={disabled}
              placeholder={placeholder}
              className="h-7 text-xs placeholder:text-muted-foreground/50"
              {...register(name)}
            />
          )
        }
      </FieldWrapper>
    </div>
  );
}
