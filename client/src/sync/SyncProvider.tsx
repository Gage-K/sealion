import { useEffect } from "react";
import { useCRDT } from "../hooks/useCRDT";
import type { SyncTransport, SyncTransportDeps } from "./SyncTransport";
import { WebSocketTransport } from "./WebSocketTransport";

/**
 * Wires the CRDT to a SyncTransport for the whole tree. This is pure wiring, not
 * a context: no component consumes sync any more, since a local write syncs on
 * its own. On mount it broadcasts every local change, merges remote state, and
 * pulls peers' current state once. The transport is injectable so tests mount
 * with an InMemoryTransport; production defaults to the WebSocket. Nest inside
 * CRDTProvider.
 */
export const SyncProvider = ({
  children,
  createTransport,
}: {
  children: React.ReactNode;
  createTransport?: (deps: SyncTransportDeps) => SyncTransport;
}) => {
  const crdt = useCRDT();

  useEffect(() => {
    const deps: SyncTransportDeps = {
      peerId: crdt.id,
      getState: () => crdt.state,
    };
    const transport = createTransport
      ? createTransport(deps)
      : new WebSocketTransport(deps);

    const offRemote = transport.onRemote((state) => crdt.merge(state));
    const offLocal = crdt.subscribeLocal(() => transport.broadcast(crdt.state));
    transport.requestState();

    return () => {
      offLocal();
      offRemote();
      transport.dispose();
    };
  }, [crdt, createTransport]);

  return <>{children}</>;
};
