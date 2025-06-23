import { useEffect, useState } from "react";
import * as Tone from "tone";

interface HookOutput {
  bpm: number;
  handleBPMChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useBPM(initialBPM: number = 120): HookOutput {
  const [bpm, setBPM] = useState<number>(initialBPM);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newBPM = parseInt(e.target.value);
      setBPM(newBPM);
    } else {
      setBPM(initialBPM);
    }
  };

  return { bpm, handleBPMChange };
}
