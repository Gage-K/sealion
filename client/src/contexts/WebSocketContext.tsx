import { useCallback, useEffect, useMemo, useRef } from "react";
import type { DrumSynthCRDT } from "../types/crdt";
import { useCRDT } from "../hooks/useCRDT";
import { WebSocketContext } from "../hooks/useWebSocket";

interface Message {
  type: "update" | "request";
  id: string;
  data?: DrumSynthCRDT["state"];
}

/**
 * Owns a single WebSocket connection for the whole client and synchronizes
 * sequence state between clients. Nest inside CRDTProvider so every consumer
 * shares one connection instead of opening its own.
 */
export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const drumSynthCRDT = useCRDT();
  // Keep a live ref so the socket handlers always read the current CRDT
  // without needing to reconnect.
  const crdtRef = useRef(drumSynthCRDT);
  crdtRef.current = drumSynthCRDT;
  const wsRef = useRef<WebSocket | null>(null);

  const sendUpdate = useCallback((drumSynthCRDT: DrumSynthCRDT) => {
    const message: Message = {
      type: "update",
      id: drumSynthCRDT.globalSettings.id,
      data: drumSynthCRDT.state,
    };
    wsRef.current?.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_WS_URL || "ws://localhost:8080"
    );
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      console.log("[WebSocket] Fetching state...");
      ws.send(
        JSON.stringify({
          type: "request",
          id: crdtRef.current.globalSettings.id,
        })
      );
    };
    ws.onerror = (err) => console.error("[WebSocket] Error:", err);
    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);
        const crdt = crdtRef.current;

        // Validate message structure
        if (!message.type || !message.id) {
          console.warn("[WebSocket] Invalid message format:", message);
          return;
        }

        if (message.type === "request" && message.id !== crdt.globalSettings.id) {
          console.log("[WebSocket] Sending state...");
          sendUpdate(crdt);
        } else if (
          message.type === "update" &&
          message.id !== crdt.globalSettings.id
        ) {
          if (message.data) {
            console.log("[WebSocket] Merging remote state...");
            crdt.merge(message.data);
          } else {
            console.warn(
              "[WebSocket] Update message missing data:",
              message
            );
          }
        }
      } catch (err) {
        console.error("[WebSocket] Data retrieval failed:", err);
      }
    };

    ws.onclose = () => {
      console.warn("[WebSocket] Connection closed");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sendUpdate]);

  const value = useMemo(() => ({ sendUpdate }), [sendUpdate]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
