import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../config";
import { initializeSchema } from "./schema";

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    mkdirSync(dirname(config.dbPath), { recursive: true });
    db = new Database(config.dbPath);
    initializeSchema(db);
  }
  return db;
}

export function closeDb(): void {
  db?.close();
  db = null;
}
