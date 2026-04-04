import { Checkbox } from "@/components/ui/checkbox";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { useConfig } from "@/context/config-context";

export function OutputOptions() {
  const { state, dispatch } = useConfig();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output Options</h3>
      <FieldWrapper name="Show generated header comment" inline>
        {({ id }) => (
          <Checkbox id={id} checked={state.showHeader} onCheckedChange={() => dispatch({ type: "TOGGLE_HEADER" })} />
        )}
      </FieldWrapper>
      <FieldWrapper name="Hide fields matching defaults" inline>
        {({ id }) => (
          <Checkbox
            id={id}
            checked={state.omitDefaults}
            onCheckedChange={() => dispatch({ type: "TOGGLE_OMIT_DEFAULTS" })}
          />
        )}
      </FieldWrapper>
    </div>
  );
}
