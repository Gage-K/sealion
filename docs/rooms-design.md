# Rooms & Persistence — Design

**Status:** Proposed · **Date:** 2026-11-27 · **Scope:** v1 room system + durable storage + presence

## Problem

Sealion is a collaborative sequencer whose shared document is a hand-rolled LWW
CRDT ([`client/src/types/crdt.ts`](../client/src/types/crdt.ts)). Today that
document has **no home**: it exists only in the union of currently-connected
clients' memory. The server ([`server/app.js`](../server/app.js)) is a dumb
broadcast relay — no rooms, no persistence, no auth. Close the last tab and the
session is gone.

We want two things that turn out to be the same thing:

1. **Rooms** — a Jackbox-style join code so people can share a live session.
2. **Durable storage** — a session you can leave and come back to later.

The core decision: **a room is a durable, server-persisted document with a
stable identity. A "live session" is just whoever is currently connected to that
document.** Saving is not a separate feature — the room *is* the save.

## Current architecture (as-is)

- **CRDT:** `DrumSynthCRDT` = global settings + N tracks (each with
  `TrackSettingsCRDT` + `SequencerCRDT`), built on `LWWRegister` / `LWWMap`.
  Fully JSON-serializable via `.state`.
- **Identity:** the CRDT `id` is a fresh `crypto.randomUUID()` per page load
  (`CRDTProvider`). Ephemeral, per-tab.
- **Transport:** one WebSocket per client, now behind a `SyncTransport` seam
  (`client/src/sync/`: `WebSocketTransport` for production, `InMemoryTransport`
  for tests, wired by `SyncProvider`). The server still just forwards every
  message to every *other* connected socket. The `request`/`update` framing and
  peer-id echo-filtering live inside `WebSocketTransport`.
- **Sync handshake:** on connect a client sends `{type:"request"}`; any peer
  with a different `id` replies with its full `.state`; every edit broadcasts
  the full state. Fragile — it asks a *random* differing peer, and an empty
  room has nobody to answer. (The merge-echo problem is already solved: the CRDT
  has separate local-write vs render notify channels, so applying a remote merge
  never re-broadcasts.)
- **Durability:** none.

> **Note (updated during Phase 0):** the sync layer is already abstracted behind
> `SyncTransport`, which is where the authoritative server and room scoping plug
> in (Phases 1–2) — a room-aware `WebSocketTransport` rather than a rewrite of
> the UI. The shared CRDT (`@sealion/crdt`) now exists (Phase 0 complete).

## Goals / non-goals

**Goals (v1)**
- Create a room → get a shareable 6-char code / URL.
- Join a room by code or link; see live collaborative edits.
- State survives all clients disconnecting and is restored on reopen.
- Presence: see who else is currently in the room.

**Non-goals (v1)**
- Accounts, ownership, access control (code is the key — see D2).
- Horizontal scale / multi-process (single Hetzner VPS — see D1).
- Delta/patch protocol — we keep the existing full-state broadcast (deferred).

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Scale target | Single VPS, hobby scale. Optimize for simplicity. |
| D2 | What is a room | **Durable, server-persisted document** with stable id. |
| D3 | Server role in a live session | **Authoritative CRDT merger** (holds a real `DrumSynthCRDT` per active room), not a dumb relay. |
| D4 | Accounts | **None.** The code *is* the key. No owner, no revoke. |
| D5 | Entry flow | **Explicit lobby:** Create or Join. No code = connected to nothing. |
| D6 | Join code | **6 chars**, unambiguous alphabet (no `0/O/1/I/L`), server-minted, collision-checked, also usable as a URL. |
| D7 | Persistence backend | **SQLite** (`better-sqlite3`), one row per room; doubles as the room registry. |
| D8 | Write cadence | Merge in memory instantly; **debounced disk flush (~1s)** + forced flush on room-empty. |
| D9 | Empty-room lifecycle | **Flush + evict from memory; lazy-reload from disk on next join.** Disk is the durable home. |
| D10 | LWW invariants | (i) **Seed-before-edit**; (ii) **server only `merge`s, never `set`s**. |
| D11 | Presence | In scope for v1. Ephemeral, connection-scoped, **never persisted**. |

### D3 rationale — why an authoritative merger, not opaque relay

Because every client broadcasts its **entire** `.state` (including per-key LWW
clocks) on every edit, an opaque "store the last blob I saw" server can persist a
blob whose clocks are *older* than another client's — so a **cold room could
rehydrate slightly stale**. A server that merges into its own authoritative CRDT
never has this problem: it answers every state-request from its own copy and
persists exactly what it holds. It also deletes the fragile "ask a random peer
for state" handshake.

**Cost:** the CRDT currently lives under `client/`. The server must *run* it, so
we extract it into a shared workspace package (pnpm workspaces already in use).

### D6 rationale — why 6 chars, not Jackbox's 4

Jackbox codes are 4 chars because the room dies in an hour. Ours are **durable**,
so a 4-char code (~450k combos, few active rooms) is realistically scannable — a
stranger could enumerate codes and find saved sessions. Six chars from a ~32-char
alphabet is ~10⁹ combinations, making scanning impractical at hobby scale
*without* needing accounts. This is how we buy privacy cheaply given D4.

## Target architecture

```
packages/crdt         ← shared: DrumSynthCRDT + LWW classes (moved from client)
  └─ used by client AND server

client/
  Lobby  ──create/join──▶  RoomView(code)
                              ├─ CRDTProvider(roomId)      seeded from server
                              ├─ WebSocketProvider(roomId) connects to /room/:code
                              └─ PresenceProvider

server/ (authoritative)
  RoomManager
    ├─ in-memory: Map<code, { crdt: DrumSynthCRDT, sockets, presence, flushTimer }>
    ├─ SQLite (better-sqlite3): rooms table = registry + durable store
    └─ per-connection: route by room, merge, persist, broadcast, track presence
```

### Data model (SQLite)

```sql
CREATE TABLE rooms (
  code        TEXT PRIMARY KEY,   -- 6-char, unambiguous alphabet
  state       TEXT NOT NULL,      -- JSON of DrumSynthCRDT.state
  created_at  INTEGER NOT NULL,   -- epoch ms
  updated_at  INTEGER NOT NULL
);
```

Presence is **not** in this table — it lives only in server memory for the life
of the connections.

### Room lifecycle

1. **Create** — client asks the server to create a room. Server mints a code
   (generate → check `rooms` for collision → retry), inserts a row with an
   initial empty `DrumSynthCRDT().state`, and returns the code. Client navigates
   to `/room/<code>`.
2. **Join** — client opens `/room/<code>` (typed code or link) and connects the
   WebSocket scoped to that code.
3. **Hydrate / seed-before-edit (D10.i)** — on connect, the server ensures the
   room's CRDT is in memory (lazy-load from SQLite if evicted), then **sends the
   authoritative `.state` first**. The client merges it *before* the UI is
   editable. This guarantees a client's first `set` increments from the *loaded*
   LWW counter, not from zero, so edits can't silently lose to persisted values.
4. **Live** — client edits broadcast full `.state`; the server merges into its
   own CRDT (D3), persists (debounced, D8), and relays to the other sockets in
   the same room. The server **only merges, never sets** (D10.ii).
5. **Empty** — when the last socket for a code closes, the server forces a final
   flush, then evicts the CRDT from memory (D9).
6. **Reopen** — next join for that code lazy-loads the row back into a fresh
   in-memory CRDT. Clocks were persisted, so counters keep climbing — no reset.

### Presence (D11)

- Carried over the **same WebSocket**, scoped to the room.
- On join the client sends a lightweight presence hello (a connection-scoped
  random id + an **ephemeral nickname** — anonymous, since D4 means no accounts).
- The server tracks `{ connId, nickname }` per socket in memory and broadcasts
  the room's roster on join/leave; it prunes on socket close.
- Presence is **never written to SQLite** and does not affect the CRDT or the
  durable document in any way.

**Proposed presence defaults (flag if you disagree):**
- Nickname: user-entered in the lobby; fall back to a random animal-style name.
- Roster granularity for v1: just "who's here" (list of nicknames + count). Live
  cursors / per-step highlighting are a later add.
- No presence history — leave the room and you vanish from the roster.

### Protocol (messages)

Existing, now room-scoped: `request`, `update` (unchanged shape, full `.state`).
New: `presence/hello`, `presence/roster`, `presence/leave`. All messages are
implicitly bound to the room the socket connected to (no global bus).

## Invariants to preserve (D10)

1. **Seed-before-edit** — a client must merge the server's authoritative state
   before its UI can mutate the CRDT. Treat this as a hard requirement of the
   join handshake, not an optimization.
2. **Server merges only** — the authoritative server never authors values
   (`.set`), so it needs no clock identity of its own. It is a reconciler.
3. LWW tie-break by random per-load `peer` id stays as-is: "who wins a
   simultaneous edit" is arbitrary but consistent, and nothing durable relies on
   it.

## Deferred (explicitly out of v1)

- **Delta/patch protocol** — keep the full-`.state` broadcast for now. Sending
  only changed registers is a correct-but-independent optimization.
- Accounts, ownership, kick/revoke.
- Live cursors / fine-grained presence.
- Multi-process / horizontal scale.

## File-level impact (sketch)

- **New** `packages/crdt/` — move `client/src/types/crdt.ts` here; export for
  both sides; add to `pnpm-workspace.yaml`.
- **New** `server/` modules — `RoomManager`, SQLite setup, code generation,
  room-scoped connection routing, presence tracking. Replace the broadcast loop
  in [`server/app.js`](../server/app.js).
- **Client** — new `Lobby` + `RoomView`; make
  [`CRDTContext`](../client/src/contexts/CRDTContext.tsx) and
  [`WebSocketContext`](../client/src/contexts/WebSocketContext.tsx) take a
  `roomId` and instantiate *after* a room is chosen; gate editing on
  seed-complete; add a `PresenceProvider`; routing for `/room/:code`.
- **Config** — `VITE_WS_URL` stays; the WS URL now carries/encodes the room code.
