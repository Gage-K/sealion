import { useEffect, useState } from "react";
import * as Tone from "tone";
import { useCRDT } from "./useCRDT";
import { useWebSocketSync } from "./useWebSocketSync.ts";

interface HookOutput {
  bpm: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useBPM(): HookOutput {
  const drumSynthCRDT = useCRDT();
  const [bpm, setBPM] = useState(drumSynthCRDT.globalSettings.bpm);
  const { sendUpdate } = useWebSocketSync();

  useEffect(() => {
    const unsubscribe = drumSynthCRDT.globalSettings.subscribe(() => {
      setBPM(drumSynthCRDT.globalSettings.bpm);
    });
    return unsubscribe;
  }, [drumSynthCRDT]);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      drumSynthCRDT.globalSettings.setBPM(newBPM);
      // TODO: add some debouncing so every change is not sent
      sendUpdate(drumSynthCRDT);
    }
  };

  return { bpm, handleBPMChange };
}
