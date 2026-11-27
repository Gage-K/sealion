import { useEffect, useState } from "react";
import { useCRDT } from "../hooks/useCRDT";
import { RoomStatusContext, type RoomStatus } from "../hooks/useRoomStatus";
import { PresenceContext } from "../hooks/usePresence";
import { roomWsUrl } from "../config/server";
import { getNickname } from "../config/identity";
import type { Member, SyncTransport, SyncTransportDeps } from "./SyncTransport";
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
  const [roster, setRoster] = useState<Member[]>([]);

  useEffect(() => {
    setStatus("connecting");
    setRoster([]);
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
    const offPresence = transport.onPresence?.((msg) => {
      if (msg.type === "presence/roster") setRoster(msg.members);
    });
    const offLocal = crdt.subscribeLocal(() => transport.broadcast(crdt.state));
    transport.requestState();
    // Announce ourselves; the server replies to the room with the roster. The
    // frame is queued until the socket opens, like requestState.
    transport.sendPresence?.({
      type: "presence/hello",
      connId: crdt.id,
      nickname: getNickname(),
    });

    return () => {
      offLocal();
      offRemote();
      offStatus?.();
      offPresence?.();
      transport.dispose();
    };
  }, [crdt, code, createTransport]);

  return (
    <RoomStatusContext.Provider value={status}>
      <PresenceContext.Provider value={roster}>
        {children}
      </PresenceContext.Provider>
    </RoomStatusContext.Provider>
  );
};
