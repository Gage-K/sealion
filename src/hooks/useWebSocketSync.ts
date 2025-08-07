import { useEffect, useRef } from "react";
import type { DrumSynthCRDT } from "../types/crdt";
import { useCRDT } from "./useCRDT.ts";

interface Message {
  type: "update" | "request";
  id: string;
  data?: DrumSynthCRDT["state"];
}

/**
 * Initializes Web Scoket connections between clients
 * Handles transfer of sequence state for data synchronization
 * Closes web socket connection on unmount
 * @param handleRemoteUpdate
 * @returns A function that receives a request to modify sequence and transfers to subscribed clients
 */
export function useWebSocketSync() {
  const wsRef = useRef<WebSocket | null>(null);
  // const localClientId = useRef(crypto.randomUUID());
  // const lastUpdatedIdRef = useRef<string>("");
  const drumSynthCRDT = useCRDT();

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_WS_URL || "ws://localhost:8080"
    ); // adjust port as needed
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      console.log("[WebSocket] Fetching state...");
      ws.send(
        JSON.stringify({ type: "request", id: drumSynthCRDT.globalSettings.id })
      );
    };
    ws.onerror = (err) => console.error("[WebSocket] Error:", err);
    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);

        // Validate message structure
        if (!message.type || !message.id) {
          console.warn("[WebSocket] Invalid message format:", message);
          return;
        }

        if (
          message.type === "request" &&
          message.id !== drumSynthCRDT.globalSettings.id
        ) {
          console.log("[WebSocket] Sending state...");
          sendUpdate(drumSynthCRDT);
        } else if (
          message.type === "update" &&
          message.id !== drumSynthCRDT.globalSettings.id
        ) {
          if (message.data) {
            console.log("[WebSocket] Merging remote state...");
            const remoteState: DrumSynthCRDT["state"] = message.data;
            console.log(remoteState);
            drumSynthCRDT.merge(remoteState);
          } else {
            console.warn(
              "[WebSocket] Update message missing data.state:",
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
      wsRef.current = null;
    };

    return () => {
      // ws.close();
    };
  }, [drumSynthCRDT]);

  const sendUpdate = (drumSynthCRDT: DrumSynthCRDT) => {
    const message: Message = {
      type: "update",
      id: drumSynthCRDT.globalSettings.id,
      data: drumSynthCRDT.state,
    };
    console.log("sending message");
    wsRef.current?.send(JSON.stringify(message));
  };

  return { sendUpdate };
}
