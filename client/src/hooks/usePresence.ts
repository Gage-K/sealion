import { createContext, useContext } from "react";
import type { Member } from "../sync/SyncTransport";

export type { Member };

/**
 * The room's current roster — who's connected right now (design D11). Ephemeral
 * and connection-scoped; it rides the same socket as sync but is never
 * persisted. Provided by SyncProvider, read by the roster UI.
 */
export const PresenceContext = createContext<Member[]>([]);

export const usePresence = () => useContext(PresenceContext);
