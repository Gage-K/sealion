import type { SyncState, SyncTransport, SyncTransportDeps } from "./SyncTransport";

/**
 * An in-process stand-in for the network. Every transport sharing one hub is a
 * peer; a broadcast is delivered synchronously (same tick) to the others, which
 * makes convergence tests deterministic — edit on one peer, assert on another
 * with no awaiting. A second adapter against the SyncTransport interface, which
 * is what turns that interface into a real seam rather than a hypothetical one.
 */
export class InMemoryHub {
  #members = new Map<InMemoryTransport, () => SyncState>();

  register(transport: InMemoryTransport, getState: () => SyncState) {
    this.#members.set(transport, getState);
  }

  unregister(transport: InMemoryTransport) {
    this.#members.delete(transport);
  }

  broadcastFrom(sender: InMemoryTransport, state: SyncState) {
    for (const member of this.#members.keys()) {
      if (member !== sender) member.deliver(state);
    }
  }

  /** Every other peer replies to the sender with its current state. */
  requestFrom(sender: InMemoryTransport) {
    for (const [member, getState] of this.#members) {
      if (member !== sender) sender.deliver(getState());
    }
  }
}

export class InMemoryTransport implements SyncTransport {
  #hub: InMemoryHub;
  #handlers = new Set<(state: SyncState) => void>();

  constructor(hub: InMemoryHub, deps: SyncTransportDeps) {
    this.#hub = hub;
    this.#hub.register(this, deps.getState);
  }

  broadcast(state: SyncState) {
    this.#hub.broadcastFrom(this, state);
  }

  requestState() {
    this.#hub.requestFrom(this);
  }

  onRemote(handler: (state: SyncState) => void) {
    this.#handlers.add(handler);
    return () => {
      this.#handlers.delete(handler);
    };
  }

  /** Called by the hub to hand this peer another peer's state. */
  deliver(state: SyncState) {
    this.#handlers.forEach((h) => h(state));
  }

  dispose() {
    this.#hub.unregister(this);
    this.#handlers.clear();
  }
}
