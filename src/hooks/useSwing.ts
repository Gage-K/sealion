import { useEffect, useState } from "react";
import * as Tone from "tone";
import { useCRDT } from "./useCRDT";
import { useWebSocketSync } from "./useWebSocketSync";

interface HookOutput {
  swing: number;
  handleSwingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useSwing(): HookOutput {
  const drumSynthCRDT = useCRDT();
  const [swing, setSwing] = useState(drumSynthCRDT.globalSettings.swing);
  const { sendUpdate } = useWebSocketSync();

  useEffect(() => {
    const unsubscribe = drumSynthCRDT.globalSettings.subscribe(() => {
      setSwing(drumSynthCRDT.globalSettings.swing);
    });
    return unsubscribe;
  }, [drumSynthCRDT]);

  useEffect(() => {
    Tone.getTransport().swing = swing;
  }, [swing]);

  const handleSwingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newSwing = parseFloat(e.target.value);
      drumSynthCRDT.globalSettings.setSwing(newSwing);
      sendUpdate(drumSynthCRDT);
    }
  };

  return { swing, handleSwingChange };
}
