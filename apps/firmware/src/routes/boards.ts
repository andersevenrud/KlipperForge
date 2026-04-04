import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { McuBoardIndex } from "@klipperforge/printer-data";
import { Hono } from "hono";
import { config } from "../config";
import { loadBoardJson } from "../services/board-data";
import { findPresetForMcu } from "../services/config-generator";
import type { BoardEntry, PresetResponse } from "../types";

export const boardsRouter = new Hono();

boardsRouter.get("/", (c) => {
  const indexPath = join(config.boardDataPath, "mcu-boards", "index.json");
  console.log(`[route] GET /boards — indexPath=${indexPath}`);
  if (!existsSync(indexPath)) {
    console.log("[route] Board index not found");
    return c.json({ boards: [] });
  }

  const index = JSON.parse(readFileSync(indexPath, "utf-8")) as McuBoardIndex;
  console.log(`[route] Loaded ${index.boards.length} boards`);
  const boards: BoardEntry[] = index.boards.map((b) => {
    let mcu = "";
    let hasPreset = false;

    const boardData = loadBoardJson(b.id);
    let flash: BoardEntry["flash"];
    let mcuVariants: string[] | undefined;
    if (boardData) {
      mcu = boardData.mcu;
      hasPreset = findPresetForMcu(mcu) !== null;
      flash = boardData.flash;
      mcuVariants = boardData.mcuVariants;
    }

    return {
      id: b.id,
      name: b.name,
      vendor: b.vendor,
      mcu,
      hasPreset,
      ...(mcuVariants?.length ? { mcuVariants } : {}),
      ...(flash ? { flash } : {}),
    };
  });

  return c.json({ boards });
});

boardsRouter.get("/:boardId/presets", (c) => {
  const { boardId } = c.req.param();
  const mcuParam = c.req.query("mcu");
  console.log(`[route] GET /boards/${boardId}/presets${mcuParam ? ` mcu=${mcuParam}` : ""}`);

  const boardData = loadBoardJson(boardId);
  if (!boardData) {
    return c.json({ error: "Board not found" }, 404);
  }

  const validMcus = [boardData.mcu, ...(boardData.mcuVariants ?? [])];
  if (mcuParam && !validMcus.includes(mcuParam)) {
    return c.json({ error: "Invalid MCU variant" }, 400);
  }

  const effectiveMcu = mcuParam ?? boardData.mcu;
  const preset = findPresetForMcu(effectiveMcu);

  if (!preset) {
    return c.json({ error: "No firmware preset for this MCU" }, 404);
  }

  const response: PresetResponse = {
    mcuFamily: preset.mcuFamily,
    outputFile: preset.outputFile,
    ...(boardData.flashFilename ? { flashFilename: boardData.flashFilename } : {}),
    ...(preset.flashMethods ? { flashMethods: preset.flashMethods } : {}),
    interfaces: Object.entries(preset.interfaces).map(([id, iface]) => ({
      id,
      label: iface.label,
      options: iface.options,
    })),
    bootloaderOffsets: Object.entries(preset.bootloaderOffsets).map(([id, bl]) => ({
      id,
      label: bl.label,
      ...(bl.flashAddress ? { flashAddress: bl.flashAddress } : {}),
    })),
    clockRefs: Object.entries(preset.clockRefs).map(([id, cr]) => ({
      id,
      label: cr.label,
    })),
  };

  return c.json(response);
});
