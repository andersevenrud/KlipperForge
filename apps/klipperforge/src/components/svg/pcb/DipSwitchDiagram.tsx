import type { JumperOption } from "@klipperforge/printer-data";
import { CATEGORY_COLORS } from "./PcbConnectorRect";

type DipSwitchSize = "sm" | "lg";

interface DipSwitchDiagramProps {
  options: JumperOption[];
  size?: DipSwitchSize;
  selectedLabel?: string;
  onSelectOption?: (label: string) => void;
}

interface SwitchToggleProps {
  on: boolean;
  color: string;
  size: DipSwitchSize;
}

function SwitchToggle({ on, color, size }: SwitchToggleProps) {
  const isLarge = size === "lg";
  const trackW = isLarge ? "w-5" : "w-2.5";
  const trackH = isLarge ? "h-8" : "h-4";
  const thumbSize = isLarge ? "size-4" : "size-2";

  return (
    <span
      className={`${trackW} ${trackH} rounded-sm flex flex-col items-center border`}
      style={{
        borderColor: on ? color : "var(--color-border)",
        backgroundColor: on ? `${color}20` : "var(--color-muted)",
      }}
    >
      {on ? (
        <>
          <span className="flex-1" />
          <span className={`${thumbSize} rounded-sm mb-0.5`} style={{ backgroundColor: color }} />
        </>
      ) : (
        <>
          <span className={`${thumbSize} rounded-sm mt-0.5 bg-muted-foreground/30`} />
          <span className="flex-1" />
        </>
      )}
    </span>
  );
}

export function DipSwitchDiagram({ options, size = "sm", selectedLabel, onSelectOption }: DipSwitchDiagramProps) {
  const activeColor = CATEGORY_COLORS.jumper.active;
  const isLarge = size === "lg";
  const hasSelection = selectedLabel !== undefined;

  const textClass = isLarge ? "text-xs" : "text-[9px]";
  const numTextClass = isLarge ? "text-[10px]" : "text-[8px]";
  const switchGapClass = isLarge ? "gap-1.5" : "gap-0.5";
  const cellPadding = isLarge ? "px-2 py-1.5" : "px-1 py-0.5";

  const switchCount = options[0]?.pattern[0]?.length ?? 0;

  return (
    <table className="border-separate border-spacing-0">
      <thead>
        <tr>
          <th />
          <th className="pb-0.5">
            <div className={`flex ${switchGapClass}`}>
              {Array.from({ length: switchCount }, (_, i) => (
                <span
                  key={`hdr-${i.toString()}`}
                  className={`${numTextClass} font-normal text-muted-foreground text-center ${isLarge ? "w-5" : "w-2.5"}`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {options.map((option) => {
          const switches = option.pattern[0] ?? [];
          const isSelected = selectedLabel === option.label;
          const dimmed = hasSelection && !isSelected;

          return (
            <tr
              key={option.label}
              className={`rounded transition-opacity ${
                isSelected ? "ring-1 ring-cyan-500/60 bg-cyan-500/10" : ""
              } ${dimmed ? "opacity-40" : ""} ${onSelectOption ? "cursor-pointer hover:bg-muted" : ""}`}
              onClick={
                onSelectOption
                  ? (e) => {
                      e.stopPropagation();
                      onSelectOption(option.label);
                    }
                  : undefined
              }
              onKeyDown={
                onSelectOption
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onSelectOption(option.label);
                      }
                    }
                  : undefined
              }
            >
              <td className={`${textClass} font-medium text-foreground/70 pr-2 ${cellPadding} whitespace-nowrap`}>
                {option.label}
              </td>
              <td className={cellPadding}>
                <div className={`flex ${switchGapClass}`}>
                  {switches.map((val, i) => (
                    <SwitchToggle key={`sw-${i.toString()}`} on={val === 1} color={activeColor} size={size} />
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
