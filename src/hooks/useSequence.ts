import { useEffect, useState } from "react";
import { useCRDT } from "./useCRDT";
import type { Step } from "../types/crdt";
import { useWebSocketSync } from "./useWebSocketSync";

interface UseSequenceProps {
  currentTrackIndex: number;
}

interface UseSequenceReturn {
  sequence: Step[];
  handleSequenceChange: (trackIndex: number, stepIndex: number) => void;
}

export const useSequence = ({
  currentTrackIndex,
}: UseSequenceProps): UseSequenceReturn => {
  const drumSynthCRDT = useCRDT();
  const { sendUpdate } = useWebSocketSync();
  const [sequence, setSequence] = useState(
    drumSynthCRDT.getTrackSequence(currentTrackIndex)
  );

  useEffect(() => {
    const unsubscribe = drumSynthCRDT.tracks[
      currentTrackIndex
    ].sequence.subscribe(() => {
      setSequence(drumSynthCRDT.getTrackSequence(currentTrackIndex));
    });
    return unsubscribe;
  }, [drumSynthCRDT, currentTrackIndex]);

  const handleSequenceChange = (trackIndex: number, stepIndex: number) => {
    drumSynthCRDT.tracks[trackIndex].sequence.toggleStep(stepIndex);
    sendUpdate(drumSynthCRDT);
  };

  return {
    sequence,
    handleSequenceChange,
  };
};
