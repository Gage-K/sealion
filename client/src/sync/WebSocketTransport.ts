import type {
  ConnStatus,
  SyncState,
  SyncTransport,
  SyncTransportDeps,
} from "./SyncTransport";

/** Wire protocol spoken to the sync server. Kept private to this adapter. */
interface Message {
  type: "update" | "request";
  id: string;
  data?: SyncState;
}

/**
 * The production transport: one WebSocket per client. It owns the request/update
 * framing and the peer-id filtering so the SyncTransport interface stays in
 * terms of state. A peer's `request` is answered here, from the owner's
 * `getState` thunk, rather than by special-casing message types upstream.
 *
 * Sends issued before the socket opens are queued and flushed on open, so the
 * provider can call `requestState()` immediately on mount.
 */
export class WebSocketTransport implements SyncTransport {
  #ws: WebSocket;
  #peerId: string;
  #getState: () => SyncState;
  #handlers = new Set<(state: SyncState) => void>();
  #statusHandlers = new Set<(status: ConnStatus) => void>();
  #pending: string[] = [];
  #disposed = false;

  constructor(
    deps: SyncTransportDeps,
    url: string = import.meta.env.VITE_WS_URL || "ws://localhost:8080",
  ) {
    this.#peerId = deps.peerId;
    this.#getState = deps.getState;

    const ws = new WebSocket(url);
    this.#ws = ws;

    ws.onopen = () => {
      console.log("[Sync] Connected");
      for (const msg of this.#pending) ws.send(msg);
      this.#pending = [];
      this.#emitStatus("open");
    };

    ws.onerror = (err) => {
      console.error("[Sync] Error:", err);
      this.#emitStatus("error");
    };
    ws.onclose = () => {
      console.warn("[Sync] Connection closed");
      this.#emitStatus("closed");
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);

        if (!message.type || !message.id) {
          console.warn("[Sync] Invalid message format:", message);
          return;
        }

        // Ignore our own echoes.
        if (message.id === this.#peerId) return;

        if (message.type === "request") {
          // A peer asked for current state; reply with ours.
          this.#send({ type: "update", id: this.#peerId, data: this.#getState() });
        } else if (message.type === "update") {
          if (message.data) {
            this.#handlers.forEach((h) => h(message.data!));
          } else {
            console.warn("[Sync] Update message missing data:", message);
          }
        }
      } catch (err) {
        console.error("[Sync] Data retrieval failed:", err);
      }
    };
  }

  #send(message: Message) {
    if (this.#disposed) return;
    const serialized = JSON.stringify(message);
    if (this.#ws.readyState === WebSocket.OPEN) {
      this.#ws.send(serialized);
    } else {
      this.#pending.push(serialized);
    }
  }

  broadcast(state: SyncState) {
    this.#send({ type: "update", id: this.#peerId, data: state });
  }

  requestState() {
    this.#send({ type: "request", id: this.#peerId });
  }

  onRemote(handler: (state: SyncState) => void) {
    this.#handlers.add(handler);
    return () => {
      this.#handlers.delete(handler);
    };
  }

  onStatus(handler: (status: ConnStatus) => void) {
    this.#statusHandlers.add(handler);
    return () => {
      this.#statusHandlers.delete(handler);
    };
  }

  #emitStatus(status: ConnStatus) {
    if (this.#disposed) return;
    this.#statusHandlers.forEach((h) => h(status));
  }

  dispose() {
    this.#disposed = true;
    this.#handlers.clear();
    this.#statusHandlers.clear();
    this.#pending = [];
    this.#ws.close();
  }
}
