import type { McuBoardIndexEntry } from "@klipperforge/printer-data";
import { BookOpen, Check, ChevronsUpDown, CircuitBoard, Eye, Image, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMcu } from "@/context/mcu-context";
import { SectionHeader } from "./SectionHeader";

interface BoardComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  boardIndex: McuBoardIndexEntry[];
  pcbBoardIds: Set<string>;
  imageBoardIds: Set<string>;
}

function BoardCombobox({ value, onValueChange, boardIndex, pcbBoardIds, imageBoardIds }: BoardComboboxProps) {
  const [open, setOpen] = useState(false);

  const groupedBoards = useMemo(() => {
    const groups = new Map<string, Pick<McuBoardIndexEntry, "id" | "name">[]>();
    for (const board of boardIndex) {
      const existing = groups.get(board.vendor);
      if (existing) {
        existing.push(board);
      } else {
        groups.set(board.vendor, [{ id: board.id, name: board.name }]);
      }
    }
    return groups;
  }, [boardIndex]);

  const selectedBoard = boardIndex.find((b) => b.id === value);
  const displayLabel = selectedBoard ? `${selectedBoard.vendor} ${selectedBoard.name}` : "Select board...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-7 w-full justify-between text-xs font-normal" aria-expanded={open}>
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search boards..." className="text-xs" />
          <CommandList>
            <CommandEmpty className="p-3 text-xs">No board found.</CommandEmpty>
            {[...groupedBoards.entries()]
              .sort(([a], [b]) => {
                if (a === "Generic") return 1;
                if (b === "Generic") return -1;
                return a.localeCompare(b);
              })
              .map(([vendor, boards]) => (
                <CommandGroup key={vendor} heading={vendor}>
                  {boards.map((board) => (
                    <CommandItem
                      key={board.id}
                      value={`${vendor} ${board.name}`}
                      onSelect={() => {
                        onValueChange(board.id);
                        setOpen(false);
                      }}
                      className="text-xs"
                    >
                      <Check className={`mr-1 h-3 w-3 ${value === board.id ? "opacity-100" : "opacity-0"}`} />
                      {board.name}
                      {(pcbBoardIds.has(board.id) || imageBoardIds.has(board.id)) && (
                        <span className="ml-auto flex gap-1">
                          {pcbBoardIds.has(board.id) && (
                            <span title="Has interactive PCB layout">
                              <CircuitBoard className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
                          {imageBoardIds.has(board.id) && (
                            <span title="Has board image">
                              <Image className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function McuBoardList() {
  const navigate = useNavigate();
  const { state, dispatch, boardIndex, pcbBoardIds, imageBoardIds } = useMcu();

  return (
    <div className="flex flex-col gap-3">
      <SectionHeader label="MCU Boards">
        <Button variant="outline" size="sm" onClick={() => dispatch({ type: "ADD_BOARD" })}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </SectionHeader>

      {state.boards.map((instance, index) => (
        <div key={`${index}-${instance.boardId}`} className="flex flex-col gap-2 rounded-md bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FieldWrapper name={index === 0 ? "Primary MCU" : "Additional MCU"}>
                {() => (
                  <BoardCombobox
                    value={instance.boardId}
                    onValueChange={(value) =>
                      dispatch({
                        type: "UPDATE_BOARD",
                        payload: { index, boardId: value },
                      })
                    }
                    boardIndex={boardIndex}
                    pcbBoardIds={pcbBoardIds}
                    imageBoardIds={imageBoardIds}
                  />
                )}
              </FieldWrapper>
            </div>
            <div className="mt-4 flex shrink-0 gap-1">
              {instance.boardId && !instance.boardId.startsWith("generic-") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={() => navigate(`/documentation?board=${instance.boardId}`)}
                  title="View documentation"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </Button>
              )}
              {state.boards.length > 1 && (
                <Button
                  variant={state.activePcbBoard === index ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={() =>
                    dispatch({
                      type: "SET_ACTIVE_PCB_BOARD",
                      payload: { index },
                    })
                  }
                  title="Show PCB layout"
                >
                  <Eye className={`h-3.5 w-3.5 ${state.activePcbBoard === index ? "text-foreground" : ""}`} />
                </Button>
              )}
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_BOARD",
                      payload: { index },
                    })
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {index > 0 && (
            <div>
              <FieldWrapper name="Alias">
                {({ id }) => (
                  <Input
                    id={id}
                    value={instance.alias}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_BOARD",
                        payload: { index, alias: e.target.value },
                      })
                    }
                    placeholder="e.g. toolhead"
                    className="h-7 text-xs"
                  />
                )}
              </FieldWrapper>
            </div>
          )}

          {instance.board && (
            <p className="text-xs text-muted-foreground">
              {instance.board.mcuVariants?.length
                ? [instance.board.mcu, ...instance.board.mcuVariants].join(" / ")
                : instance.board.mcu}{" "}
              &middot; {instance.board.pins.length} pins
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
