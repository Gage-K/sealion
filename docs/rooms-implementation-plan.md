# Rooms & Persistence — Implementation Plan

Companion to [rooms-design.md](./rooms-design.md). Decisions are referenced as
**D1–D11** from that doc. The work is split into phases that each leave the app
in a **runnable, checkpointable** state. Protocol efficiency (delta encoding) is
out of scope; presence **is** in scope (Phase 3).

## Decisions still needed before/while coding

These are small forks the design left open; recommended answers in **bold**.

- **Routing** — no router is installed. **Hand-roll minimal routing** (read
  `window.location.pathname`: no `/room/...` → Lobby; `/room/:code` → RoomView)
  to avoid a dependency. Add `react-router-dom` later only if routes multiply.
- **Create-room transport** — **a tiny HTTP route** (`POST /rooms`) on the
  existing `http` server, rather than overloading the WebSocket, so room
  creation works before any socket is open.
- **Nickname entry (presence)** — **captured in the Lobby/Join screen**, passed
  into `RoomView`, sent in the presence hello. Fallback to a random name.

---

## Phase 0 — Extract the shared `@sealion/crdt` package ✅ DONE

**Goal:** the CRDT classes run in both client and server (prerequisite for D3).

**What actually shipped** (the tree had advanced past the original plan — a
`SyncTransport` seam already existed, and `crdt.ts` had *two* client couplings,
`DRUM_SYNTH_CONFIG` **and** `./effects`):

- New top-level source-only package `crdt/` → `@sealion/crdt` (JIT `.ts` entry
  via `exports: "./src/index.ts"`; no build step — Vite transpiles, `tsc`
  resolves it under `moduleResolution: bundler`). Holds the LWW primitives,
  `DrumSynthCRDT`, and the **pure effect schema** (`crdt/src/effects.ts`).
- `DrumSynthCRDT` constructor now takes injected `trackDefaults: TrackDefault[]`;
  track count derives from its length. Client factory
  `client/src/config/makeCRDT.ts` feeds it from `DRUM_SYNTH_CONFIG`.
- **Re-export shims kept the blast radius tiny:** `client/src/types/crdt.ts` →
  `export * from "@sealion/crdt"`; `client/src/types/effects.ts` re-exports the
  package schema and keeps its `clamp`-using helpers + rack control specs. All
  ~21 downstream importers were untouched.
- Only two call sites changed: `CRDTContext.tsx` and `sync/sync.test.ts` (both
  now use `makeDrumSynthCRDT`). `server/package.json` gained the dep for Phase 1.
- **Checkpoint met:** `@sealion/crdt` typechecks, all 10 client tests pass, and
  `pnpm --filter @sealion/client build` succeeds. No behavior change.

---

### Original Phase 0 notes (for reference)

1. Create a new top-level package `crdt/`:
   - `crdt/package.json` → name `@sealion/crdt`, `"type": "module"`, a `build`
     (tsc) + `test` (vitest) script, export of the compiled/`.ts` entry.
   - `crdt/tsconfig.json`.
2. Move [`client/src/types/crdt.ts`](../client/src/types/crdt.ts) → `crdt/src/index.ts`.
   Keep `DrumSynthCRDT`, the LWW classes, and the exported types.
   - ⚠️ `crdt.ts` imports `DRUM_SYNTH_CONFIG` from `client/src/config`. The shared
     package **must not** depend on client code. Pass the per-track defaults
     (envelope/pattern) into `DrumSynthCRDT`'s constructor instead of importing
     config. The client supplies `DRUM_SYNTH_CONFIG`; the server supplies the
     same defaults (or an equivalent constant shared in `@sealion/crdt`).
3. Register the package in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml)
   (`packages: - crdt`).
4. Add `@sealion/crdt` as a workspace dependency of `client` and `server`
   (`"@sealion/crdt": "workspace:*"`).
5. Update client imports (`client/src/types/crdt` → `@sealion/crdt`) in
   `CRDTContext`, `useCRDT`, `useWebSocket`, and anything using the types.

**Checkpoint:** `pnpm build` and `pnpm --filter @sealion/client dev` work exactly
as before — single global room, no behavior change yet. Add unit tests for LWW
merge/tie-break in `crdt/` while the code is fresh.

---

## Phase 1 — Server becomes an authoritative, persistent RoomManager ✅ DONE

**Goal:** D3 (authoritative merger), D6 (codes), D7 (SQLite), D8 (cadence),
D9 (evict/reload), D10 (merge-only).

**What shipped:**

- `server/src/db.js` — `better-sqlite3` (WAL), the `rooms` table, and
  `getRoomState` / `roomExists` / `insertRoom` / `saveRoomState`. `DB_PATH` env,
  default `./data/sealion.db` (gitignored).
- `server/src/codes.js` — 6-char codes from a 31-char unambiguous alphabet,
  collision-checked against the table.
- `server/src/roomManager.js` — `Map<code, LiveRoom>`; `createRoom` (mint +
  insert empty doc), `getOrLoad` (live or lazy-load from SQLite, null if
  unknown), `applyUpdate` (**`crdt.merge` only**, D10.ii), coalescing ~1s flush
  (flushes once per burst, not a trailing reset), `onEmpty` (force flush +
  evict, D9). `SERVER_ID` is inert since the server never `.set`s.
- `server/app.js` — `POST /rooms` → `{ code }` (+ permissive CORS, health at
  `/`); WebSocket at `ws://host/room/<code>` via a manual `upgrade` handler that
  404s unknown codes. On connect it **sends authoritative `.state` first**
  (D10.i); `update` → merge + relay to the room's other sockets; `request` →
  answer from the server's own copy (kills the ask-a-peer handshake); last
  close → `onEmpty`.
- Shared **`DEFAULT_KIT`** added to `@sealion/crdt` (`crdt/src/kit.ts`) as the
  single source of truth for track **count**; the server builds its CRDT from
  it, and the client asserts no drift vs `DRUM_SYNTH_CONFIG` at startup.

**Deviations worth carrying into Phase 4:**

- **`better-sqlite3` pinned to `^11`.** v13's bundled prebuilt binary segfaults
  on Node 22 (our LTS/Docker target); v11's `prebuild-install` fetches a
  Node-22-compatible binary, so **no compile toolchain is needed** on dev or in
  the Alpine image. Its build script is enabled in `allowBuilds`.
- **The server runs under `tsx`** (`dev`/`start` scripts) so it can import the
  source-only `@sealion/crdt` `.ts` package at runtime — plain `node` can't
  strip types from a dependency. `tsx` is a **runtime** dep (not dev), so the
  prod `CMD` becomes `tsx server/app.js` (Phase 4).
- The existing client still connects to a bare `ws://host` with no room, so it
  won't talk to this server until Phase 2 wires the lobby + `/room/<code>` URL.

**Checkpoint met** (scratch `ws` + `fetch` harness, fresh temp DB): `POST
/rooms` mints a code; an unknown code is rejected; two sockets on one code seed
+ sync; `request` is answered authoritatively; a second room is isolated; and a
full **server restart preserves state** (evict on empty → lazy reload on
rejoin). bpm=142 written in run 1 came back after restart in run 2.

---

### Original Phase 1 notes (for reference)

1. **Deps / build gate:** add `better-sqlite3` to `server/package.json`, and add
   `better-sqlite3: true` under `allowBuilds` in `pnpm-workspace.yaml` (pnpm
   blocks native postinstall scripts otherwise).
2. **SQLite layer** (`server/src/db.js`): open the DB file (path from
   `process.env.DB_PATH`, default `./data/sealion.db`), create the `rooms` table
   from the design (`code` PK, `state` TEXT, `created_at`, `updated_at`).
   Prepared statements: `getRoom`, `upsertRoom`, `roomExists`.
3. **Code generation** (`server/src/codes.js`): 6 chars from an unambiguous
   alphabet (no `0/O/1/I/L`); generate → `roomExists` check → retry on collision.
4. **RoomManager** (`server/src/roomManager.js`): `Map<code, LiveRoom>` where
   `LiveRoom = { crdt: DrumSynthCRDT, sockets:Set, presence:Map, flushTimer }`.
   - `getOrLoad(code)` — return the live room, or lazy-load `state` from SQLite
     into a fresh `DrumSynthCRDT`; return null if the code doesn't exist.
   - `applyUpdate(code, state)` — **`crdt.merge(state)` only, never `.set`**
     (D10.ii); schedule a debounced (~1s) flush (D8).
   - `flush(code)` — `upsertRoom(code, JSON.stringify(crdt.state))`.
   - `onEmpty(code)` — force a final `flush`, clear the timer, delete from the
     Map (D9).
5. **HTTP create route:** `POST /rooms` → mint code, `upsertRoom` with
   `new DrumSynthCRDT(...).state`, respond `{ code }`.
6. **Room-scoped WebSocket:** read the code from the upgrade URL
   (`ws://host/room/<code>`) in the `connection` handler. Reject unknown codes.
   Replace the broadcast-to-everyone loop in
   [`server/app.js`](../server/app.js) with per-room routing:
   - On connect: `getOrLoad`, add socket to the room, **send the authoritative
     `.state` immediately** (D10.i seed-before-edit).
   - On `update`: `applyUpdate`, then relay to the *other* sockets in that room.
   - On `request`: answer from the server's own `crdt.state` (kills the
     ask-a-random-peer handshake).
   - On close: remove socket; if the room is now empty, `onEmpty`.

**Checkpoint:** with a hand-made `POST /rooms` + a `ws://.../room/<code>` client
(curl + a scratch script, or Phase 2), two sockets on the same code sync; a third
code is isolated; restarting the server preserves state; an evicted room reloads
on rejoin.

---

## Phase 2 — Client lobby, routing, and room-scoped providers ✅ DONE

**Goal:** D5 (lobby), D6 (URL), D10.i (gate editing until seeded).

**What shipped:**

- `client/src/routing.ts` — hand-rolled routing (`usePathname` via
  `useSyncExternalStore` + `navigate`), no router dependency.
- `client/src/Root.tsx` + `main.tsx` — shell: `/room/<code>` → `RoomView`
  (keyed by code), else `Lobby`. The provider stack moved out of `main.tsx`
  into `RoomView`, so nothing connects until a room is chosen.
- `client/src/config/server.ts` — `VITE_WS_URL` base, HTTP base derived from it,
  `createRoom()` (`POST /rooms`), `roomWsUrl`, and code parse/validate helpers
  (accepts a raw code or a pasted `/room/<code>` link, normalizes case).
- `client/src/config/identity.ts` — ephemeral nickname in sessionStorage
  (random animal default), captured in the lobby for Phase 3 presence.
- `client/src/components/Lobby.tsx` — create / join / nickname (D5).
- `client/src/components/RoomView.tsx` — mounts CRDT → Sync(code) → AudioEngine
  **only once seeded**; shows a connecting state, a "room not found" state for
  an unknown code, and a small room-code + copy-link badge.
- `SyncProvider` now takes a `code`, connects to `ws://host/room/<code>`, and
  tracks the handshake: first remote merge → `ready` (seed-before-edit, D10.i);
  a close/error before that → `error`. Exposed via `RoomStatusContext`
  (`useRoomStatus`). The `SyncTransport` seam gained an optional `onStatus`;
  `WebSocketTransport` reports open/close/error (InMemoryTransport unaffected).

**Checkpoint met** (live, two browser tabs against a dev server): lobby →
create lands in `/room/<code>` with a shareable URL; a second tab on that URL
gets the authoritative seed and edits sync **live both ways**; reload restores
state from the server; an unknown code shows "room not found"; join-by-code
normalizes case. `tsc -b` + `vite build` clean; 10/10 tests pass.

---

### Original Phase 2 notes (for reference)

1. **Minimal routing** in `main.tsx`/`App` shell: no `/room/...` → `<Lobby>`;
   `/room/:code` → `<RoomView code=...>`.
2. **Lobby** (`client/src/components/Lobby.tsx`): "Create" → `POST /rooms` →
   `history.pushState` to `/room/<code>`; "Join" → input a code (or paste link) →
   navigate. Capture the nickname here for presence.
3. **Room-scoped providers:** change
   [`CRDTContext`](../client/src/contexts/CRDTContext.tsx) and
   [`WebSocketContext`](../client/src/contexts/WebSocketContext.tsx) to take a
   `roomId`/`code`. Instantiate them **inside `RoomView`**, after a room is
   chosen — not at app mount. The socket connects to
   `${VITE_WS_URL}/room/<code>`.
4. **Seed-before-edit gate (D10.i):** `WebSocketProvider` tracks a `hydrated`
   flag, set true after the first authoritative `update` is merged. `RoomView`
   shows a brief "connecting…" state and keeps the synth UI non-editable until
   `hydrated`. Existing edit handlers in `useAudioActions` stay unchanged; they
   just can't fire before hydration.
5. Remove the old unconditional global connect. The synth UI
   ([`App.tsx`](../client/src/App.tsx) body) renders inside `RoomView`.

**Checkpoint:** open the app → Lobby. Create → land in a room with a shareable
URL. Open that URL in a second tab → both edit in sync. Reload a tab → state
restored from the server. A fresh random code URL → "room not found".

---

## Phase 3 — Presence / awareness (D11) ✅ DONE

**Goal:** see who's in the room. Ephemeral, never persisted.

**What shipped:**

- Presence rides the **same room socket** as sync (not a second connection or a
  separate provider). The `SyncTransport` seam gained optional `sendPresence` /
  `onPresence` + a `PresenceMessage`/`Member` type; `WebSocketTransport` routes
  any `presence/*` frame to presence handlers before the state path.
- **Protocol:** client → `presence/hello { connId, nickname }` (connId = the
  CRDT peer id; nickname from the lobby); server → `presence/roster { members }`
  to the whole room on every join/leave; `presence/leave` accepted too, though
  socket close is the main path.
- **Server** keeps `room.presence` as `Map<socket, {connId, nickname}>` and
  rebroadcasts the roster on hello and on close. It **never touches SQLite or the
  CRDT** — a separate branch from `update`/`request`.
- **Client:** `SyncProvider` sends hello on connect and exposes the roster via
  `PresenceContext` (`usePresence`); `RoomView` renders a compact roster
  (count + nicknames, the viewer marked YOU).

**Deviation:** presence lives in `SyncProvider` (which already owns the socket)
rather than a standalone `PresenceProvider` — same behavior, one less layer.

**Checkpoint met** (live, two tabs as ALICE/BOB): each sees the other in the
roster with itself marked YOU; a join updates both within a moment; closing a
tab drops its member from the other's roster. Build + 10/10 tests green.

**Proposed defaults (unchanged):** nickname-only roster, no cursors, no history.

---

### Original Phase 3 notes (for reference)

1. **Protocol:** add `presence/hello` (`{ connId, nickname }`), `presence/roster`
   (`{ members: [{connId, nickname}] }`), `presence/leave`. All room-scoped.
2. **Server:** store `{ connId, nickname }` per socket in `LiveRoom.presence`;
   on hello/close, broadcast the updated roster to the room. **Never touch
   SQLite or the CRDT** with presence data.
3. **Client:** `PresenceProvider` sends hello on connect (nickname from Lobby),
   listens for rosters, exposes the member list. A small roster UI (count +
   nicknames) in `RoomView`.

**Proposed defaults (from the design):** nickname-only roster, no live cursors,
no presence history. Flag if you want cursors/step-highlighting — that's an
additive follow-up on the same channel.

**Checkpoint:** two tabs show each other in the roster; closing one updates the
other within a moment.

---

## Phase 4 — Deploy wiring + end-to-end verification ✅ DONE

**Goal:** the model survives a real deploy on the Hetzner VPS (you just added the
prod Docker setup in `7d5e67f`).

**What shipped:**

- **Both Dockerfiles now copy `crdt/`** — the Phase 0 workspace split had broken
  them (neither resolved `@sealion/crdt`). `server/Dockerfile.prod` also copies
  the CRDT **source** (tsx loads it at runtime) and runs
  `CMD ["server/node_modules/.bin/tsx", "server/app.js"]`;
  `client/Dockerfile.prod` copies it for the Vite build.
- **`better-sqlite3` needs no toolchain in the image** — `prebuild-install`
  downloads the `linuxmusl` prebuild during `pnpm install` (build enabled in
  `allowBuilds`).
- **Durable volume** — `docker-compose.prod.yml` mounts the named volume
  `sealion-data` at `/data` and sets `DB_PATH=/data/sealion.db`, so rooms
  outlive container restarts/rebuilds.
- **`/ws` prefix tolerance** — the server strips a leading `/ws` (the edge's
  route key), so both `ws://host/ws/room/<code>` and `POST /ws/rooms` work
  whether or not Caddy strips the prefix; dev's bare paths are unaffected. The
  SPA `try_files` fallback already serves `/room/<code>` → index.html, so nginx
  is unchanged.
- **`.dockerignore`** excludes local SQLite data; **`docs/deploy.md`** updated
  (prefix routing, durable volume + backup, rooms-not-stateless notes).

**Checkpoint met:** `docker compose config` validates; **both images build**;
the `sealion-sync` image boots under tsx, loads the musl `better-sqlite3`
prebuild, serves health + `POST /ws/rooms`, accepts WS at `/room/<code>` and
`/ws/room/<code>`, rejects unknown codes, and a room **survived a container
restart** on the volume.

---

### Original Phase 4 notes (for reference)

1. **Native module + TS runtime in Docker:** `better-sqlite3@11`'s
   `prebuild-install` downloads a `linuxmusl` prebuild on `node:22-alpine`, so
   **no `python3`/`make`/`g++` toolchain is needed** — just make sure its build
   script runs during `pnpm install` (it's enabled in `allowBuilds`; the current
   `--prod` install must still run it). The server now runs under **`tsx`** (a
   runtime dep), so update [`server/Dockerfile.prod`](../server/Dockerfile.prod)
   `CMD` from `node server/app.js` to `tsx server/app.js` (or
   `node --import tsx server/app.js`). If a prebuild ever isn't available, add
   the toolchain back as a fallback.
2. **Durable volume:** mount a volume for `DB_PATH` in
   [`docker-compose.prod.yml`](../docker-compose.prod.yml) so the SQLite file
   outlives container restarts. Set `DB_PATH` to the mounted path.
3. **Routing/proxy:** ensure the WS path `/room/<code>` and `POST /rooms` pass
   through the client's nginx / proxy ([`client/nginx.spa.conf`](../client/nginx.spa.conf))
   and that SPA fallback serves `/room/:code` to `index.html`.
4. **Update [`docs/deploy.md`](./deploy.md)** with the new env vars and volume.

**Manual acceptance (the whole model):**
- Create → share URL → second machine joins → live sync. ✅ D2/D5/D6
- Everyone leaves → reopen URL → state intact. ✅ D2/D9
- Hard-kill the server mid-edit → lose ≤ ~1s, not the room. ✅ D8
- Roster reflects who's connected. ✅ D11

---

## Suggested sequencing

Phases are ordered by dependency: **0 → 1 → 2 → 3 → 4**. Phase 0 is a safe
no-behavior-change refactor and a good first commit/PR. Phase 1 is the heaviest
(server rewrite) and is independently testable before any UI exists. Phases 2–3
are client-side and can share a PR. Phase 4 is deploy glue.
