import { createServer } from "http";
import { WebSocketServer } from "ws";
import * as rooms from "./src/roomManager.js";

/**
 * Authoritative, room-scoped sync server (rooms design, Phase 1).
 *
 * - HTTP `POST /rooms` mints a room and returns its code.
 * - WebSocket `ws://host/room/<code>` is scoped to one room: the server seeds
 *   the client with authoritative state, merges its edits into its own CRDT,
 *   persists them, and relays to the other sockets in that room.
 *
 * Wire protocol (shared with the client's WebSocketTransport):
 *   { type: "update" | "request", id: string, data?: DrumSynthCRDT.state }
 * The server tags its own sends with SERVER_ID so clients don't treat the
 * authoritative state as their own echo.
 */

const { SERVER_ID } = rooms;

// --- HTTP: room creation + health -----------------------------------------

const server = createServer((req, res) => {
  // Permissive CORS: the client dev server and the static SPA are served from
  // other origins, and rooms are public-by-code anyway (D4).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = stripWsPrefix(req.url);

  if (req.method === "POST" && path === "/rooms") {
    try {
      const code = rooms.createRoom();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code }));
      console.log(`[Server] created room ${code}`);
    } catch (err) {
      console.error("[Server] room creation failed:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "could not create room" }));
    }
    return;
  }

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("sealion sync server ok");
    return;
  }

  res.writeHead(404);
  res.end();
});

// --- WebSocket: one socket per client, scoped to a room --------------------

const wss = new WebSocketServer({ noServer: true });

/**
 * Strip the edge proxy's `/ws` route prefix if present, so the server accepts
 * both the bare paths (dev: ws://host:8080/room/<code>) and the prefixed ones
 * (prod: the Caddy edge routes `/ws` → here, and may or may not strip it).
 */
function stripWsPrefix(url = "") {
  return url.replace(/^\/ws(?=\/|$)/, "") || "/";
}

/** Extract the room code from a `/room/<code>` upgrade URL, or null. */
function parseRoomCode(url) {
  const match = /^\/room\/([^/?#]+)/.exec(stripWsPrefix(url));
  return match ? match[1] : null;
}

/**
 * Send the room's current roster to everyone in it (design D11). Presence lives
 * only in `room.presence` (keyed by socket) — never in SQLite or the CRDT.
 */
function broadcastRoster(room) {
  const members = [...room.presence.values()];
  const payload = JSON.stringify({ type: "presence/roster", members });
  for (const peer of room.sockets) {
    if (peer.readyState === peer.OPEN) peer.send(payload);
  }
}

// Reject unknown/malformed room URLs before completing the upgrade, so a bad
// code never opens a socket.
server.on("upgrade", (req, socket, head) => {
  const code = parseRoomCode(req.url);
  const room = code ? rooms.getOrLoad(code) : null;
  if (!room) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, { code, room });
  });
});

wss.on("connection", (ws, _req, { code, room }) => {
  room.sockets.add(ws);
  console.log(`[Server] joined ${code} (${room.sockets.size} connected)`);

  // Seed-before-edit (D10.i): the client merges this before its UI is editable.
  ws.send(JSON.stringify({ type: "update", id: SERVER_ID, data: room.crdt.state }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "presence/hello") {
      room.presence.set(ws, {
        connId: String(msg.connId ?? ""),
        nickname: String(msg.nickname ?? "anon").slice(0, 24),
      });
      broadcastRoster(room);
      return;
    }

    if (msg.type === "presence/leave") {
      if (room.presence.delete(ws)) broadcastRoster(room);
      return;
    }

    if (msg.type === "request") {
      // Answer from our own authoritative copy (replaces the ask-a-peer dance).
      ws.send(
        JSON.stringify({ type: "update", id: SERVER_ID, data: room.crdt.state }),
      );
      return;
    }

    if (msg.type === "update" && msg.data) {
      rooms.applyUpdate(code, msg.data);
      // Relay the originating peer's update to the other sockets in this room.
      const out = raw.toString();
      for (const peer of room.sockets) {
        if (peer !== ws && peer.readyState === peer.OPEN) peer.send(out);
      }
    }
  });

  ws.on("close", () => {
    room.sockets.delete(ws);
    const wasPresent = room.presence.delete(ws);
    console.log(`[Server] left ${code} (${room.sockets.size} connected)`);
    if (room.sockets.size === 0) {
      rooms.onEmpty(code);
    } else if (wasPresent) {
      broadcastRoster(room);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`);
});
