import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { BoardEntry } from "@/api/firmware-types";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BoardSelectorProps {
  boards: BoardEntry[];
  selectedBoardId: string | null;
  onSelect: (boardId: string) => void;
  disabled?: boolean;
}

export function BoardSelector({ boards, selectedBoardId, onSelect, disabled }: BoardSelectorProps) {
  const [open, setOpen] = useState(false);

  const groupedBoards = useMemo(() => {
    const groups = new Map<string, BoardEntry[]>();
    for (const board of boards) {
      if (!board.hasPreset) continue;
      const existing = groups.get(board.vendor) ?? [];
      existing.push(board);
      groups.set(board.vendor, existing);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "Generic") return 1;
      if (b === "Generic") return -1;
      return a.localeCompare(b);
    });
  }, [boards]);

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const displayLabel = selectedBoard ? `${selectedBoard.vendor} ${selectedBoard.name}` : "Select a board";

  return (
    <div className="space-y-2">
      <FieldWrapper name="Board" disabled={disabled}>
        {({ id, disabled }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={id}
                variant="outline"
                className="w-full justify-between font-normal"
                disabled={disabled}
                aria-expanded={open}
              >
                <span className="truncate">{displayLabel}</span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search boards..." />
                <CommandList>
                  <CommandEmpty>No board found.</CommandEmpty>
                  {groupedBoards.map(([vendor, vendorBoards]) => (
                    <CommandGroup key={vendor} heading={vendor}>
                      {vendorBoards.map((board) => (
                        <CommandItem
                          key={board.id}
                          value={`${board.vendor} ${board.name}`}
                          onSelect={() => {
                            onSelect(board.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 size-4 ${selectedBoardId === board.id ? "opacity-100" : "opacity-0"}`}
                          />
                          {board.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({board.mcuVariants?.length ? [board.mcu, ...board.mcuVariants].join(" / ") : board.mcu})
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </FieldWrapper>
    </div>
  );
}
