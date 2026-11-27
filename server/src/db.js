import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * SQLite persistence for rooms (design D7). One row per room; the table doubles
 * as the room registry — a room "exists" iff it has a row here. The in-memory
 * CRDT is the live copy; this is the durable home it flushes to (D8/D9).
 */

const DB_PATH = resolve(process.env.DB_PATH || "./data/sealion.db");

// Ensure the directory exists before better-sqlite3 opens the file.
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
// WAL: concurrent reads during a write, and durable enough for hobby scale.
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    code        TEXT PRIMARY KEY,   -- 6-char, unambiguous alphabet
    state       TEXT NOT NULL,      -- JSON of DrumSynthCRDT.state
    created_at  INTEGER NOT NULL,   -- epoch ms
    updated_at  INTEGER NOT NULL
  );
`);

const stmts = {
  get: db.prepare("SELECT state FROM rooms WHERE code = ?"),
  exists: db.prepare("SELECT 1 FROM rooms WHERE code = ? LIMIT 1"),
  insert: db.prepare(
    "INSERT INTO rooms (code, state, created_at, updated_at) VALUES (?, ?, ?, ?)",
  ),
  update: db.prepare("UPDATE rooms SET state = ?, updated_at = ? WHERE code = ?"),
};

/** The room's persisted state as a JSON string, or null if the code is unknown. */
export function getRoomState(code) {
  const row = stmts.get.get(code);
  return row ? row.state : null;
}

export function roomExists(code) {
  return stmts.exists.get(code) !== undefined;
}

/** Insert a brand-new room row (used by room creation). */
export function insertRoom(code, stateJson) {
  const now = Date.now();
  stmts.insert.run(code, stateJson, now, now);
}

/** Overwrite an existing room's state (used by flush). */
export function saveRoomState(code, stateJson) {
  stmts.update.run(stateJson, Date.now(), code);
}

export { DB_PATH };
export default db;
