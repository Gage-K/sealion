import { createContext, useContext } from "react";

/**
 * Where a room's connection is in the join handshake:
 * - "connecting": socket open, authoritative seed not yet merged
 * - "ready":      seed merged — editing is now safe (seed-before-edit, D10.i)
 * - "error":      the socket closed/errored before seeding (e.g. unknown code)
 */
export type RoomStatus = "connecting" | "ready" | "error";

export const RoomStatusContext = createContext<RoomStatus>("connecting");

export const useRoomStatus = () => useContext(RoomStatusContext);
