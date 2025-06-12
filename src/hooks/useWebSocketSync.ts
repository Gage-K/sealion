import { useEffect, useRef } from "react";

/**
 * Initializes Web Scoket connections between clients
 * Handles transfer of sequence state for data synchronization
 * Closes web socket connection on unmount
 * @param handleRemoteUpdate
 * @returns A function that receives a request to modify sequence and transfers to subscribed clients
 */
export function useWebSocketSync({
  handleRemoteUpdate,
}: {
  handleRemoteUpdate: (trackIndex: number, stepIndex: number) => void;
}) {
  const wsRef = useRef<WebSocket | null>(null);
  const localClientId = useRef(crypto.randomUUID());
  const lastUpdatedIdRef = useRef<string>("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080"); // adjust port as needed
    wsRef.current = ws;

    ws.onopen = () => console.log("[WebSocket] Connected");
    ws.onerror = (err) => console.error("[WebSocket] Error:", err);
    ws.onmessage = (event) => {
      try {
        const { trackIndex, stepIndex, clientId, updateId } = JSON.parse(
          event.data
        );

        if (
          clientId === localClientId.current ||
          lastUpdatedIdRef.current === updateId
        ) {
          return;
        }
        lastUpdatedIdRef.current = updateId;
        handleRemoteUpdate(trackIndex, stepIndex);
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

  const sendUpdate = (trackIndex: number, stepIndex: number) => {
    const update = {
      trackIndex,
      stepIndex,
      clientId: localClientId.current,
      updateId: crypto.randomUUID(),
    };
    wsRef.current?.send(JSON.stringify(update));
  };

  return { sendUpdate };
}
