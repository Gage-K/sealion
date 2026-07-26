import { createContext, useContext } from "react";
import type { DrumSynthCRDT } from "../types/crdt";

export interface WebSocketContextValue {
  /** Broadcasts the given CRDT's current state to all subscribed clients. */
  sendUpdate: (drumSynthCRDT: DrumSynthCRDT) => void;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(
  null
);

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return ctx;
};
