import { describe, expect, it } from "vitest";
import {
  isValidBoardId,
  isValidFilename,
  isValidPinList,
  sanitizeConfigValue,
  sanitizeFilename,
} from "../utils/sanitize";

describe("sanitizeConfigValue", () => {
  it("passes through normal values", () => {
    expect(sanitizeConfigValue("1000000")).toBe("1000000");
    expect(sanitizeConfigValue("y")).toBe("y");
    expect(sanitizeConfigValue("PA0")).toBe("PA0");
  });

  it("strips newlines", () => {
    expect(sanitizeConfigValue("value\nCONFIG_EVIL=y")).toBe("valueCONFIG_EVIL=y");
  });

  it("strips carriage returns", () => {
    expect(sanitizeConfigValue("value\r\nCONFIG_EVIL=y")).toBe("valueCONFIG_EVIL=y");
  });

  it("strips null bytes", () => {
    expect(sanitizeConfigValue("value\0evil")).toBe("valueevil");
  });

  it("strips tabs and other control characters", () => {
    expect(sanitizeConfigValue("value\tevil")).toBe("valueevil");
    expect(sanitizeConfigValue("\x01\x02\x03safe")).toBe("safe");
  });

  it("preserves spaces (non-control)", () => {
    expect(sanitizeConfigValue("PA0 PB1")).toBe("PA0 PB1");
  });
});

describe("isValidBoardId", () => {
  it("accepts valid board IDs", () => {
    expect(isValidBoardId("btt-skr-3")).toBe(true);
    expect(isValidBoardId("btt-octopus-pro-1.1")).toBe(true);
    expect(isValidBoardId("mks_robin_nano_v3")).toBe(true);
    expect(isValidBoardId("123board")).toBe(true);
  });

  it("rejects path traversal attempts", () => {
    expect(isValidBoardId("../../../etc/passwd")).toBe(false);
    expect(isValidBoardId("..")).toBe(false);
    expect(isValidBoardId("foo/../bar")).toBe(false);
  });

  it("rejects path separators", () => {
    expect(isValidBoardId("foo/bar")).toBe(false);
    expect(isValidBoardId("foo\\bar")).toBe(false);
  });

  it("rejects empty and invalid starts", () => {
    expect(isValidBoardId("")).toBe(false);
    expect(isValidBoardId("-starts-with-dash")).toBe(false);
    expect(isValidBoardId(".starts-with-dot")).toBe(false);
  });

  it("rejects uppercase", () => {
    expect(isValidBoardId("BTT-SKR")).toBe(false);
  });

  it("rejects excessively long IDs", () => {
    expect(isValidBoardId("a".repeat(101))).toBe(false);
    expect(isValidBoardId("a".repeat(100))).toBe(true);
  });
});

describe("isValidFilename", () => {
  it("accepts valid filenames", () => {
    expect(isValidFilename("klipper.bin")).toBe(true);
    expect(isValidFilename("klipper.uf2")).toBe(true);
    expect(isValidFilename("firmware-v1.0.bin")).toBe(true);
    expect(isValidFilename("out.elf")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isValidFilename("../etc/passwd")).toBe(false);
    expect(isValidFilename("..")).toBe(false);
    expect(isValidFilename("foo/../bar")).toBe(false);
  });

  it("rejects shell metacharacters", () => {
    expect(isValidFilename("file;rm -rf /")).toBe(false);
    expect(isValidFilename("file$(whoami)")).toBe(false);
    expect(isValidFilename("file`id`")).toBe(false);
    expect(isValidFilename("file|cat /etc/passwd")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidFilename("")).toBe(false);
  });

  it("rejects excessively long filenames", () => {
    expect(isValidFilename("a".repeat(101))).toBe(false);
    expect(isValidFilename("a".repeat(100))).toBe(true);
  });
});

describe("sanitizeFilename", () => {
  it("passes through safe filenames", () => {
    expect(sanitizeFilename("klipper.bin")).toBe("klipper.bin");
    expect(sanitizeFilename("firmware-v1.0.uf2")).toBe("firmware-v1.0.uf2");
  });

  it("replaces unsafe characters with underscores", () => {
    expect(sanitizeFilename("file;rm -rf /")).toBe("file_rm_-rf__");
  });

  it("collapses consecutive dots", () => {
    expect(sanitizeFilename("foo..bar")).toBe("foo.bar");
  });

  it("returns fallback for empty result", () => {
    expect(sanitizeFilename("")).toBe("firmware.bin");
  });
});

describe("isValidPinList", () => {
  it("accepts single pins", () => {
    expect(isValidPinList("PA0")).toBe(true);
    expect(isValidPinList("PB13")).toBe(true);
  });

  it("accepts modified pins", () => {
    expect(isValidPinList("!PA0")).toBe(true);
    expect(isValidPinList("^PB3")).toBe(true);
    expect(isValidPinList("~PC5")).toBe(true);
  });

  it("accepts comma-separated lists", () => {
    expect(isValidPinList("PA0,PB1,PC2")).toBe(true);
  });

  it("accepts space-separated lists", () => {
    expect(isValidPinList("PA0 PB1 PC2")).toBe(true);
  });

  it("rejects newline injection", () => {
    expect(isValidPinList("PA0\nCONFIG_EVIL=y")).toBe(false);
  });

  it("rejects shell metacharacters", () => {
    expect(isValidPinList("PA0;rm -rf /")).toBe(false);
    expect(isValidPinList("$(whoami)")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidPinList("")).toBe(false);
    expect(isValidPinList("   ")).toBe(false);
  });
});
