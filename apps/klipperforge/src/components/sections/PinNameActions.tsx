import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/config-context";

export function PinNameActions() {
  const { state, dispatch } = useConfig();

  const hasAliases = state.boardPinAliases.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pin Names</h3>
      {hasAliases ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => dispatch({ type: "CONVERT_PINS", payload: { direction: "aliases" } })}
          >
            Use aliases
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => dispatch({ type: "CONVERT_PINS", payload: { direction: "raw" } })}
          >
            Use raw pins
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No board aliases defined</p>
      )}
    </div>
  );
}
