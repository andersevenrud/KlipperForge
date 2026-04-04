import { describe, expect, it } from "vitest";
import {
  type BoardPinAlias,
  buildReverseAliasMap,
  convertDocumentPins,
  extractBoardPinAliases,
  parsePinAliasString,
  resolvePinAlias,
} from "../pins";
import type { ConfigDocument } from "../sections/types";

describe("parsePinAliasString", () => {
  it("parses basic comma-separated pairs", () => {
    const result = parsePinAliasString("FAN0=PA8, DRIVER0_STEP=PF13");
    expect(result).toEqual({ FAN0: "PA8", DRIVER0_STEP: "PF13" });
  });

  it("handles multiline input", () => {
    const result = parsePinAliasString("FAN0=PA8,\nDRIVER0_STEP=PF13,\nHEATER=PB1");
    expect(result).toEqual({ FAN0: "PA8", DRIVER0_STEP: "PF13", HEATER: "PB1" });
  });

  it("strips inline comments", () => {
    const result = parsePinAliasString("FAN0=PA8, # main fan\nDRIVER0_STEP=PF13");
    expect(result).toEqual({ FAN0: "PA8", DRIVER0_STEP: "PF13" });
  });

  it("handles reserved pins", () => {
    const result = parsePinAliasString("GND_PIN=<GND>, FAN0=PA8");
    expect(result).toEqual({ GND_PIN: "<GND>", FAN0: "PA8" });
  });

  it("returns empty object for empty input", () => {
    expect(parsePinAliasString("")).toEqual({});
  });

  it("handles trailing commas", () => {
    const result = parsePinAliasString("FAN0=PA8, HEATER=PB1,");
    expect(result).toEqual({ FAN0: "PA8", HEATER: "PB1" });
  });

  it("handles whitespace around equals and commas", () => {
    const result = parsePinAliasString("  FAN0 = PA8 , HEATER = PB1  ");
    expect(result).toEqual({ FAN0: "PA8", HEATER: "PB1" });
  });

  it("skips entries without equals sign", () => {
    const result = parsePinAliasString("FAN0=PA8, BADENTRY, HEATER=PB1");
    expect(result).toEqual({ FAN0: "PA8", HEATER: "PB1" });
  });
});

describe("extractBoardPinAliases", () => {
  it("extracts aliases from unnamed board_pins section", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "board_pins",
          data: {
            aliases: "FAN0=PA8, DRIVER0_STEP=PF13",
          },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result).toEqual([{ mcu: "", aliases: { FAN0: "PA8", DRIVER0_STEP: "PF13" } }]);
  });

  it("extracts aliases from named section with mcu field", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "board_pins_named",
          instanceName: "my_board",
          data: {
            mcu: "mcu2",
            aliases: "FAN0=PA8",
          },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result).toEqual([{ mcu: "mcu2", aliases: { FAN0: "PA8" } }]);
  });

  it("handles multiple board_pins sections", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "board_pins",
          data: { aliases: "FAN0=PA8" },
        },
        {
          definitionId: "board_pins_named",
          instanceName: "toolhead",
          data: { mcu: "mcu2", aliases: "FAN1=PB1" },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result).toHaveLength(2);
    expect(result[0].aliases).toEqual({ FAN0: "PA8" });
    expect(result[1].aliases).toEqual({ FAN1: "PB1" });
  });

  it("collects aliases_* keys", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "board_pins",
          data: {
            aliases: "FAN0=PA8",
            aliases_extra: "HEATER=PB1",
          },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result[0].aliases).toEqual({ FAN0: "PA8", HEATER: "PB1" });
  });

  it("ignores non-board_pins sections", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "printer",
          data: { kinematics: "cartesian", max_velocity: 300, max_accel: 3000 },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result).toEqual([]);
  });

  it("skips sections with no aliases", () => {
    const doc: ConfigDocument = {
      sections: [
        {
          definitionId: "board_pins",
          data: { mcu: "mcu2" },
        },
      ],
    };
    const result = extractBoardPinAliases(doc);
    expect(result).toEqual([]);
  });
});

describe("resolvePinAlias", () => {
  const aliases: BoardPinAlias[] = [
    { mcu: "", aliases: { FAN0: "PA8", HEATER: "PB1" } },
    { mcu: "mcu2", aliases: { FAN1: "PC3" } },
  ];

  it("resolves a direct alias", () => {
    expect(resolvePinAlias("FAN0", aliases)).toBe("PA8");
  });

  it("resolves an MCU-prefixed alias", () => {
    expect(resolvePinAlias("mcu2:FAN1", aliases)).toBe("mcu2:PC3");
  });

  it("passes through non-alias pins", () => {
    expect(resolvePinAlias("PA0", aliases)).toBe("PA0");
  });

  it("passes through reserved pins", () => {
    expect(resolvePinAlias("<GND>", aliases)).toBe("<GND>");
  });

  it("passes through empty string", () => {
    expect(resolvePinAlias("", aliases)).toBe("");
  });

  it("does not resolve alias from wrong MCU", () => {
    expect(resolvePinAlias("mcu2:FAN0", aliases)).toBe("mcu2:FAN0");
  });

  it("does not resolve main MCU alias with MCU prefix", () => {
    expect(resolvePinAlias("mcu:FAN0", aliases)).toBe("mcu:FAN0");
  });
});

describe("buildReverseAliasMap", () => {
  it("inverts alias entries", () => {
    const aliases: BoardPinAlias[] = [{ mcu: "", aliases: { FAN0: "PA8", HEATER: "PB1" } }];
    const reversed = buildReverseAliasMap(aliases);
    expect(reversed).toEqual([{ mcu: "", aliases: { PA8: "FAN0", PB1: "HEATER" } }]);
  });

  it("preserves MCU field on each entry", () => {
    const aliases: BoardPinAlias[] = [
      { mcu: "", aliases: { FAN0: "PA8" } },
      { mcu: "mcu2", aliases: { FAN1: "PC3" } },
    ];
    const reversed = buildReverseAliasMap(aliases);
    expect(reversed[0]).toEqual({ mcu: "", aliases: { PA8: "FAN0" } });
    expect(reversed[1]).toEqual({ mcu: "mcu2", aliases: { PC3: "FAN1" } });
  });
});

describe("convertDocumentPins", () => {
  const aliases: BoardPinAlias[] = [
    { mcu: "", aliases: { FAN0: "PA8", HEATER: "PB1", STEP_X: "PF13" } },
    { mcu: "mcu2", aliases: { FAN1: "PC3" } },
  ];

  it("converts aliases to raw GPIO (direction=raw)", () => {
    const doc: ConfigDocument = {
      sections: [
        { definitionId: "fan", data: { pin: "FAN0" } },
        { definitionId: "extruder", data: { heater_pin: "HEATER", step_pin: "STEP_X" } },
      ],
    };
    const result = convertDocumentPins(doc, aliases, "raw");
    expect(result.sections[0].data.pin).toBe("PA8");
    expect(result.sections[1].data.heater_pin).toBe("PB1");
    expect(result.sections[1].data.step_pin).toBe("PF13");
  });

  it("converts raw GPIO to aliases (direction=aliases)", () => {
    const doc: ConfigDocument = {
      sections: [
        { definitionId: "fan", data: { pin: "PA8" } },
        { definitionId: "extruder", data: { heater_pin: "PB1" } },
      ],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.pin).toBe("FAN0");
    expect(result.sections[1].data.heater_pin).toBe("HEATER");
  });

  it("preserves pin prefixes (!, ^, ~)", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "stepper", instanceName: "x", data: { enable_pin: "!PA8", step_pin: "^PF13" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.enable_pin).toBe("!FAN0");
    expect(result.sections[0].data.step_pin).toBe("^STEP_X");
  });

  it("handles MCU-prefixed pins", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "fan_generic", instanceName: "toolhead", data: { pin: "mcu2:PC3" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.pin).toBe("mcu2:FAN1");
  });

  it("skips reserved pins", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "fan", data: { pin: "<GND>" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.pin).toBe("<GND>");
  });

  it("skips special values like virtual_endstop", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "stepper", instanceName: "z", data: { endstop_pin: "probe:z_virtual_endstop" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.endstop_pin).toBe("probe:z_virtual_endstop");
  });

  it("does not modify board_pins sections", () => {
    const doc: ConfigDocument = {
      sections: [
        { definitionId: "board_pins", data: { aliases: "FAN0=PA8" } },
        { definitionId: "fan", data: { pin: "PA8" } },
      ],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.aliases).toBe("FAN0=PA8");
    expect(result.sections[1].data.pin).toBe("FAN0");
  });

  it("returns document unchanged when no conversions are possible", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "fan", data: { pin: "PZ99" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.pin).toBe("PZ99");
  });

  it("only converts pin and *_pin fields, not other string fields", () => {
    const doc: ConfigDocument = {
      sections: [{ definitionId: "extruder", data: { sensor_type: "PA8", heater_pin: "PA8" } }],
    };
    const result = convertDocumentPins(doc, aliases, "aliases");
    expect(result.sections[0].data.sensor_type).toBe("PA8");
    expect(result.sections[0].data.heater_pin).toBe("FAN0");
  });
});
