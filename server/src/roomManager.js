import { DrumSynthCRDT, DEFAULT_KIT } from "@sealion/crdt";
import {
  getRoomState,
  insertRoom,
  saveRoomState,
  roomExists,
} from "./db.js";
import { generateUniqueCode } from "./codes.js";

/**
 * The authoritative, persistent room layer (design D3/D8/D9/D10).
 *
 * The server holds a real DrumSynthCRDT per *active* room and is the source of
 * truth: it answers state requests from its own copy and persists exactly what
 * it holds. It only ever `merge`s client state, never `set`s (D10.ii), so it
 * needs no clock identity of its own — SERVER_ID is inert, used only to build
 * the CRDT. The authoritative state is also sent to each client before it may
 * edit (seed-before-edit, D10.i; the socket layer enforces the send order).
 *
 * Lifecycle: a room lives in memory only while sockets are connected. On the
 * last disconnect it is flushed and evicted (D9); the next join lazy-loads it
 * from SQLite, so disk is the durable home and memory is just the live cache.
 */

const SERVER_ID = "__server__";
const FLUSH_DEBOUNCE_MS = 1000;

/**
 * @typedef {{
 *   crdt: DrumSynthCRDT,
 *   sockets: Set<import("ws").WebSocket>,
 *   presence: Map<unknown, unknown>,  // reserved for Phase 3
 *   flushTimer: ReturnType<typeof setTimeout> | null,
 * }} LiveRoom
 */

/** @type {Map<string, LiveRoom>} */
const liveRooms = new Map();

/** Build an authoritative CRDT. DEFAULT_KIT fixes the track count to match the client. */
function freshCRDT(state) {
  return new DrumSynthCRDT(SERVER_ID, DEFAULT_KIT, state);
}

/**
 * Mint a new room: generate a unique code and persist an initial empty document.
 * Returns the code. The room is not held in memory until someone joins.
 */
export function createRoom() {
  const code = generateUniqueCode();
  insertRoom(code, JSON.stringify(freshCRDT().state));
  return code;
}

/**
 * Return the live room for a code, lazy-loading it from SQLite if it was
 * evicted. Returns null if the code doesn't exist (unknown room).
 * @returns {LiveRoom | null}
 */
export function getOrLoad(code) {
  const existing = liveRooms.get(code);
  if (existing) return existing;

  const stateJson = getRoomState(code);
  if (stateJson == null) return null;

  const room = {
    crdt: freshCRDT(JSON.parse(stateJson)),
    sockets: new Set(),
    presence: new Map(),
    flushTimer: null,
  };
  liveRooms.set(code, room);
  return room;
}

/**
 * Merge a client's state into the room's authoritative CRDT (merge only, never
 * set — D10.ii) and schedule a debounced flush to disk.
 */
export function applyUpdate(code, state) {
  const room = liveRooms.get(code);
  if (!room) return;
  room.crdt.merge(state);
  scheduleFlush(code);
}

/**
 * Coalesce disk writes: flush ~1s after the first update in a burst (not a
 * trailing reset), so continuous editing still persists about once a second
 * (D8) rather than being starved until the edits stop.
 */
function scheduleFlush(code) {
  const room = liveRooms.get(code);
  if (!room || room.flushTimer) return;
  room.flushTimer = setTimeout(() => {
    room.flushTimer = null;
    flush(code);
  }, FLUSH_DEBOUNCE_MS);
}

/** Persist the room's current authoritative state. */
export function flush(code) {
  const room = liveRooms.get(code);
  if (!room) return;
  saveRoomState(code, JSON.stringify(room.crdt.state));
}

/**
 * The room's last socket closed: force a final flush, cancel any pending timer,
 * and evict from memory (D9). Next join reloads it from disk.
 */
export function onEmpty(code) {
  const room = liveRooms.get(code);
  if (!room) return;
  if (room.flushTimer) {
    clearTimeout(room.flushTimer);
    room.flushTimer = null;
  }
  flush(code);
  liveRooms.delete(code);
}

export { SERVER_ID, roomExists };
