import type { SectionParams } from "../param-types";
import { createSchemaFromParams } from "../schema-from-params";
import type { SectionDefinition } from "../types";

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

export const boardPinsSchema = createSchemaFromParams(boardPinsParams);

export const boardPinsDefinition: SectionDefinition<typeof boardPinsSchema> = {
  id: "board_pins",
  naming: { kind: "custom", header: "board_pins" },
  schema: boardPinsSchema,
  params: boardPinsParams,
  metaFields: ["_boardSource"],
  order: 14,
  category: "MCU",
  label: "Board Pins",
};

export const boardPinsNamedDefinition: SectionDefinition<typeof boardPinsSchema> = {
  id: "board_pins_named",
  naming: { kind: "named", prefix: "board_pins" },
  schema: boardPinsSchema,
  params: boardPinsParams,
  metaFields: ["_boardSource"],
  order: 14,
  category: "MCU",
  label: "Board Pins (Named)",
};
