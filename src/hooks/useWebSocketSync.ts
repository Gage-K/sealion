import { useEffect, useRef } from "react";
import type { DrumSynthCRDT } from "../types/crdt";

/**
 * Initializes Web Scoket connections between clients
 * Handles transfer of sequence state for data synchronization
 * Closes web socket connection on unmount
 * @param handleRemoteUpdate
 * @returns A function that receives a request to modify sequence and transfers to subscribed clients
 */
export function useWebSocketSync({
  getLocalState,
  handleRemoteState,
}: {
  getLocalState: () => DrumSynthCRDT["state"];
  handleRemoteState: (remoteCRDT: DrumSynthCRDT) => void;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  // const localClientId = useRef(crypto.randomUUID());
  // const lastUpdatedIdRef = useRef<string>("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080"); // adjust port as needed
    wsRef.current = ws;

    ws.onopen = () => console.log("[WebSocket] Connected");
    ws.onerror = (err) => console.error("[WebSocket] Error:", err);
    ws.onmessage = (event) => {
      try {
        const remoteCRDT = JSON.parse(event.data);

        handleRemoteState(remoteCRDT);
      } catch (err) {
        console.error("[WebSocket] Data retrieval failed:", err);
      }
    };

    ws.onclose = () => {
      console.warn("[WebSocket] Connection closed");
      wsRef.current = null;
    };

    return () => {
      // ws.close();
    };
  }, []);

  const sendUpdate = () => {
    wsRef.current?.send(JSON.stringify(getLocalState()));
  };

  return { sendUpdate };
}
