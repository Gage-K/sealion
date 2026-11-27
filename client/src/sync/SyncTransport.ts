import type { DrumSynthCRDT } from "../types/crdt";

/** The full session state exchanged between peers. */
export type SyncState = DrumSynthCRDT["state"];

/** Connection lifecycle an adapter may report, for connect/"room not found" UX. */
export type ConnStatus = "open" | "closed" | "error";

/**
 * The seam over which peers exchange session state: a local change goes out via
 * `broadcast`, a remote peer's state comes in via the handler passed to
 * `onRemote`. Framing and connection details live inside each adapter, so the
 * interface speaks only in state. Two adapters satisfy it: WebSocketTransport
 * in production and InMemoryTransport in tests.
 */
export interface SyncTransport {
  /** Send this peer's full state to every other peer. */
  broadcast(state: SyncState): void;
  /** Register a handler for state arriving from a remote peer. Returns an unsubscribe. */
  onRemote(handler: (state: SyncState) => void): () => void;
  /** Ask peers for their current state — the initial pull on connect. */
  requestState(): void;
  /**
   * Observe the underlying connection's lifecycle, where the adapter has one.
   * Optional: in-process adapters (tests) have no connection to report.
   */
  onStatus?(handler: (status: ConnStatus) => void): () => void;
  /** Tear down the underlying connection or registration. */
  dispose(): void;
}

/** What an adapter needs from the owner to identify itself and answer peer requests. */
export interface SyncTransportDeps {
  /** This peer's id, so an adapter can ignore echoes of its own messages. */
  peerId: string;
  /** This peer's current full state, for answering another peer's `requestState`. */
  getState: () => SyncState;
}
