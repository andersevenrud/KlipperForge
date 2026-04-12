import type { SectionParams } from "../param-types";
import { defineSection } from "../schema-from-params";

export const BOARD_PINS_SECTION = "board_pins" as const;
export const BOARD_PINS_NAMED_SECTION = "board_pins_named" as const;

export function isBoardPinsSection(definitionId: string): boolean {
  return definitionId === BOARD_PINS_SECTION || definitionId === BOARD_PINS_NAMED_SECTION;
}

export const boardPinsParams: SectionParams = {
  mcu: {
    type: { kind: "string" },
    required: false,
    description: "The name of the mcu to use the aliases on. If not provided, defaults to the main mcu.",
  },
  aliases: {
    type: { kind: "multiline" },
    required: false,
    description: "Comma-separated list of pin aliases in NAME=PIN format. Example: FAN0=PA8, DRIVER0_STEP=PF13",
  },
};

export const { schema: boardPinsSchema, definition: boardPinsDefinition } = defineSection(boardPinsParams, {
  id: BOARD_PINS_SECTION,
  naming: { kind: "custom", header: BOARD_PINS_SECTION },
  metaFields: ["_boardSource"],
  order: 14,
  category: "MCU",
  label: "Board Pins",
});

export const { definition: boardPinsNamedDefinition } = defineSection(boardPinsParams, {
  id: BOARD_PINS_NAMED_SECTION,
  naming: { kind: "named", prefix: BOARD_PINS_SECTION },
  metaFields: ["_boardSource"],
  order: 14,
  category: "MCU",
  label: "Board Pins (Named)",
});
