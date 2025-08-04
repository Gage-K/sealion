import { useEffect, useRef } from "react";
import type { DrumSynthCRDT } from "../types/crdt";
import { useCRDT } from "./useCRDT.ts";

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
    const ws = new WebSocket("ws://localhost:8080"); // adjust port as needed
    wsRef.current = ws;

    ws.onopen = () => console.log("[WebSocket] Connected");
    ws.onerror = (err) => console.error("[WebSocket] Error:", err);
    ws.onmessage = (event) => {
      try {
        const remoteState: DrumSynthCRDT["state"] = JSON.parse(event.data);
        console.log("received remoteState", remoteState);
        drumSynthCRDT.merge(remoteState);
        console.log("bpm expected", drumSynthCRDT.globalSettings.bpm);
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

  const sendUpdate = (drumSynthCRDT: DrumSynthCRDT) => {
    console.log("sending message");
    wsRef.current?.send(JSON.stringify(drumSynthCRDT.state));
  };

  return { sendUpdate };
}
