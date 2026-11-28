import type {
  ConnStatus,
  PresenceMessage,
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
  #presenceHandlers = new Set<(message: PresenceMessage) => void>();
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
        const message: Message | PresenceMessage = JSON.parse(event.data);

        if (typeof message.type === "string" && message.type.startsWith("presence/")) {
          this.#presenceHandlers.forEach((h) => h(message as PresenceMessage));
          return;
        }

        const stateMsg = message as Message;
        if (!stateMsg.type || !stateMsg.id) {
          console.warn("[Sync] Invalid message format:", message);
          return;
        }

        // Ignore our own echoes.
        if (stateMsg.id === this.#peerId) return;

        if (stateMsg.type === "request") {
          // A peer asked for current state; reply with ours.
          this.#send({ type: "update", id: this.#peerId, data: this.#getState() });
        } else if (stateMsg.type === "update") {
          if (stateMsg.data) {
            this.#handlers.forEach((h) => h(stateMsg.data!));
          } else {
            console.warn("[Sync] Update message missing data:", stateMsg);
          }
        }
      } catch (err) {
        console.error("[Sync] Data retrieval failed:", err);
      }
    };
  }

  #send(message: Message) {
    this.#sendSerialized(JSON.stringify(message));
  }

  #sendSerialized(serialized: string) {
    if (this.#disposed) return;
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

  sendPresence(message: PresenceMessage) {
    this.#sendSerialized(JSON.stringify(message));
  }

  onPresence(handler: (message: PresenceMessage) => void) {
    this.#presenceHandlers.add(handler);
    return () => {
      this.#presenceHandlers.delete(handler);
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
    this.#presenceHandlers.clear();
    this.#pending = [];
    this.#ws.close();
  }
}
