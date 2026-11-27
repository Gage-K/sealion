import { useEffect, useState } from "react";
import { useCRDT } from "../hooks/useCRDT";
import { RoomStatusContext, type RoomStatus } from "../hooks/useRoomStatus";
import { roomWsUrl } from "../config/server";
import type { SyncTransport, SyncTransportDeps } from "./SyncTransport";
import { WebSocketTransport } from "./WebSocketTransport";

/**
 * Wires the CRDT to a SyncTransport for one room and tracks the join handshake.
 * On mount it connects (room-scoped when `code` is given), broadcasts every
 * local change, merges remote state, and pulls current state once. The first
 * remote state is the server's authoritative seed, so merging it flips the
 * status to "ready" (seed-before-edit, D10.i); a socket that closes/errors
 * before that — e.g. an unknown room code — flips it to "error". The status is
 * exposed via RoomStatusContext for the room gate to render against.
 *
 * The transport is injectable so tests can mount an InMemoryTransport. Nest
 * inside CRDTProvider.
 */
export const SyncProvider = ({
  children,
  code,
  createTransport,
}: {
  children: React.ReactNode;
  code?: string;
  createTransport?: (deps: SyncTransportDeps) => SyncTransport;
}) => {
  const crdt = useCRDT();
  const [status, setStatus] = useState<RoomStatus>("connecting");

  useEffect(() => {
    setStatus("connecting");
    let seeded = false;

    const deps: SyncTransportDeps = {
      peerId: crdt.id,
      getState: () => crdt.state,
    };
    const transport = createTransport
      ? createTransport(deps)
      : new WebSocketTransport(deps, code ? roomWsUrl(code) : undefined);

    const offRemote = transport.onRemote((state) => {
      crdt.merge(state);
      if (!seeded) {
        seeded = true;
        setStatus("ready");
      }
    });
    const offStatus = transport.onStatus?.((s) => {
      if (!seeded && (s === "error" || s === "closed")) setStatus("error");
    });
    const offLocal = crdt.subscribeLocal(() => transport.broadcast(crdt.state));
    transport.requestState();

    return () => {
      offLocal();
      offRemote();
      offStatus?.();
      transport.dispose();
    };
  }, [crdt, code, createTransport]);

  return (
    <RoomStatusContext.Provider value={status}>
      {children}
    </RoomStatusContext.Provider>
  );
};
