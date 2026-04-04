import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfig } from "@/context/config-context";
import { useMcu } from "@/context/mcu-context";
import { isReservedPin } from "@klipperforge/klipper-config";
import { AlertTriangle, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

interface PinSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

interface PinGroup {
  label: string;
  alias: string;
  pins: string[];
}

const PIN_PREFIXES = ["", "!", "^", "~", "!^", "!~", "^~", "!^~"] as const;

function parsePin(value: string): { prefix: string; rawPin: string } {
  const match = value.match(/^([!^~]*)(.*)/);
  if (!match) return { prefix: "", rawPin: value };
  return { prefix: match[1], rawPin: match[2] };
}

export function PinSelect({ value, onChange, id, disabled }: PinSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { state, getUsedPins } = useMcu();
  const { state: configState } = useConfig();

  const usedPins = useMemo(() => getUsedPins(), [getUsedPins]);

  const { prefix, rawPin } = useMemo(() => parsePin(value), [value]);

  const aliasGroups = useMemo(() => {
    return configState.boardPinAliases
      .map((ba) => ({
        label: ba.mcu ? `Pin Aliases (${ba.mcu})` : "Pin Aliases",
        mcu: ba.mcu,
        entries: Object.entries(ba.aliases).filter(([, pin]) => !isReservedPin(pin)),
      }))
      .filter((g) => g.entries.length > 0);
  }, [configState.boardPinAliases]);

  const pinGroups = useMemo(() => {
    const groups: PinGroup[] = [];

    for (const instance of state.boards) {
      if (!instance.board) continue;
      const label = instance.alias === "" ? instance.board.name : `${instance.board.name} (${instance.alias})`;
      groups.push({
        label,
        alias: instance.alias,
        pins: instance.board.pins,
      });
    }

    return groups;
  }, [state.boards]);

  const filteredAliasGroups = useMemo(() => {
    if (!search) return aliasGroups;
    const term = search.toUpperCase();
    return aliasGroups
      .map((group) => ({
        ...group,
        entries: group.entries.filter(
          ([name, pin]) => name.toUpperCase().includes(term) || pin.toUpperCase().includes(term),
        ),
      }))
      .filter((group) => group.entries.length > 0);
  }, [aliasGroups, search]);

  const filteredGroups = useMemo(() => {
    if (!search) return pinGroups;
    const term = search.toUpperCase();
    return pinGroups
      .map((group) => ({
        ...group,
        pins: group.pins.filter((pin) => pin.toUpperCase().includes(term)),
      }))
      .filter((group) => group.pins.length > 0);
  }, [pinGroups, search]);

  const handleSelect = (pin: string, alias: string) => {
    const qualified = alias === "" ? pin : `${alias}:${pin}`;
    onChange(`${prefix}${qualified}`);
    setOpen(false);
    setSearch("");
  };

  const handleAliasSelect = (aliasName: string, mcu: string) => {
    const qualified = mcu ? `${mcu}:${aliasName}` : aliasName;
    onChange(`${prefix}${qualified}`);
    setOpen(false);
    setSearch("");
  };

  const handlePrefixChange = (newPrefix: string) => {
    const effectivePrefix = newPrefix === "__none__" ? "" : newPrefix;
    onChange(`${effectivePrefix}${rawPin}`);
  };

  return (
    <div className="flex gap-1">
      <Select disabled={disabled} value={prefix || "__none__"} onValueChange={handlePrefixChange}>
        <SelectTrigger size="sm" className="h-7! shrink-0 px-2 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PIN_PREFIXES.map((p) => (
            <SelectItem key={p || "__none__"} value={p || "__none__"} className="text-xs">
              {p || "\u2014"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className="h-7 min-w-0 flex-1 justify-between text-xs font-normal"
          >
            <span className="truncate">{rawPin || "Select pin..."}</span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <div className="border-b p-2">
            <Input
              placeholder="Search or type pin..."
              className="h-7 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search) {
                  const { prefix: searchPrefix, rawPin: searchRaw } = parsePin(search);
                  const effectivePrefix = searchPrefix || prefix;
                  onChange(`${effectivePrefix}${searchRaw}`);
                  setOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filteredAliasGroups.length === 0 && filteredGroups.length === 0 && (
              <p className="p-2 text-center text-xs text-muted-foreground">
                {search ? "No pins found. Press Enter to use custom value." : "No boards loaded."}
              </p>
            )}
            {filteredAliasGroups.map((group) => (
              <div key={`alias-${group.mcu}`}>
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="flex flex-col gap-0.5">
                  {group.entries.map(([aliasName, physicalPin]) => {
                    const qualified = group.mcu ? `${group.mcu}:${aliasName}` : aliasName;
                    const isCurrentValue = rawPin === qualified || rawPin === aliasName;

                    return (
                      <button
                        key={aliasName}
                        type="button"
                        className={`flex items-center justify-between rounded px-2 py-0.5 text-xs hover:bg-accent ${
                          isCurrentValue ? "bg-accent font-medium" : ""
                        }`}
                        onClick={() => handleAliasSelect(aliasName, group.mcu)}
                      >
                        <span>{aliasName}</span>
                        <span className="text-muted-foreground">{physicalPin}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                <div className="grid grid-cols-3 gap-0.5 sm:grid-cols-4">
                  {group.pins.map((pin) => {
                    const fullPin = group.alias === "" ? pin : `${group.alias}:${pin}`;
                    const usage = usedPins.get(fullPin) ?? usedPins.get(pin);
                    const isCurrentValue = rawPin === fullPin || rawPin === pin;

                    return (
                      <button
                        key={pin}
                        type="button"
                        className={`flex items-center justify-center rounded px-1 py-0.5 text-xs hover:bg-accent ${
                          isCurrentValue ? "bg-accent font-medium" : ""
                        }`}
                        onClick={() => handleSelect(pin, group.alias)}
                        title={usage && !isCurrentValue ? `Used by ${usage.section} (${usage.field})` : undefined}
                      >
                        {pin}
                        {usage && !isCurrentValue && <AlertTriangle className="ml-0.5 h-2.5 w-2.5 text-yellow-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
