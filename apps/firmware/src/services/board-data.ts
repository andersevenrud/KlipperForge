import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config";
import type { BoardFlashInfo } from "../types";
import { isValidBoardId } from "../utils/sanitize";

interface BoardData {
  id: string;
  name: string;
  mcu: string;
  mcuVariants?: string[];
  flashFilename?: string;
  flash?: BoardFlashInfo;
}

export function loadBoardJson(boardId: string): BoardData | null {
  if (!isValidBoardId(boardId)) return null;
  const boardPath = join(config.boardDataPath, "mcu-boards", `${boardId}.json`);
  if (!existsSync(boardPath)) return null;
  return JSON.parse(readFileSync(boardPath, "utf-8")) as BoardData;
}
