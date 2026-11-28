/**
 * Where the sync server lives and how we talk to it. `VITE_WS_URL` is the
 * WebSocket base (e.g. ws://localhost:8080); the HTTP base for room creation is
 * derived from it (ws→http, wss→https) so there's one env var to set.
 */

const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
const HTTP_BASE = WS_BASE.replace(/^ws(s?):/, "http$1:");

/** The room-scoped WebSocket URL a client connects to. */
export function roomWsUrl(code: string): string {
  return `${WS_BASE}/room/${encodeURIComponent(code)}`;
}

/** Ask the server to mint a new room; resolves to its join code. */
export async function createRoom(): Promise<string> {
  const res = await fetch(`${HTTP_BASE}/rooms`, { method: "POST" });
  if (!res.ok) throw new Error(`Room creation failed (${res.status})`);
  const body = (await res.json()) as { code: string };
  return body.code;
}

// Join codes: 6 chars from the server's unambiguous alphabet (no 0/O/1/I/L).
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/**
 * Normalize whatever the user pastes into a bare code: accepts a raw code or a
 * full `/room/<code>` link, upper-cases it, and validates the shape. Returns
 * null if it isn't a well-formed code.
 */
export function parseJoinInput(input: string): string | null {
  const trimmed = input.trim();
  const fromPath = trimmed.match(/\/room\/([^/?#]+)/i);
  const candidate = (fromPath ? fromPath[1] : trimmed).toUpperCase();
  return CODE_RE.test(candidate) ? candidate : null;
}

/** The in-app path for a room. */
export function roomPath(code: string): string {
  return `/room/${code}`;
}

/** Pull a room code out of the current pathname, or null for the lobby. */
export function codeFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/room\/([^/?#]+)/);
  if (!match) return null;
  const code = decodeURIComponent(match[1]).toUpperCase();
  return CODE_RE.test(code) ? code : null;
}
