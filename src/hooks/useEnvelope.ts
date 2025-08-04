import { useState, useEffect } from "react";
import { type Envelope } from "../types/types";
import { useCRDT } from "./useCRDT";
import { DrumSynthCRDT } from "../types/crdt";
import { useWebSocketSync } from "./useWebSocketSync";

interface UseEnvelopeProps {
  updateEnvelope: (trackIndex: number, envelope: Envelope) => void;
  currentTrackIndex: number;
}

interface UseEnvelopeReturn {
  handleADSRChange: (parameter: keyof Envelope, value: number) => void;
}

export const useEnvelope = ({
  updateEnvelope,
  currentTrackIndex,
}: UseEnvelopeProps): UseEnvelopeReturn => {
  const drumSynthCRDT: DrumSynthCRDT = useCRDT();
  const { sendUpdate } = useWebSocketSync();
  const [trackADSR, setTrackADSR] = useState<Envelope[]>(
    drumSynthCRDT.tracks.map((track) => track.settings.envelope)
  );

  useEffect(() => {
    // Subscribe to ALL tracks' settings changes
    const unsubscribeFunctions = drumSynthCRDT.tracks.map((track) =>
      track.settings.subscribe(() => {
        setTrackADSR(
          drumSynthCRDT.tracks.map((track) => track.settings.envelope)
        );
      })
    );

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [drumSynthCRDT]); // Remove currentTrackIndex from dependencies

  // Updates the ADSR for the current track; ADSR is an array of objects; maps over each ADSR object and updates specified parameter with value
  const handleADSRChange = (parameter: keyof Envelope, value: number) => {
    const newADSR = {
      ...drumSynthCRDT.tracks[currentTrackIndex].settings.envelope,
      [parameter]: value,
    };
    drumSynthCRDT.tracks[currentTrackIndex].settings.setEnvelope(newADSR);
    sendUpdate(drumSynthCRDT);
  };

  // Update the tone engine when envelope changes
  useEffect(() => {
    console.log(`track envelope changed`, trackADSR);
    trackADSR.forEach((envelope, index) => {
      if (envelope) {
        updateEnvelope(index, envelope);
      }
    });
  }, [trackADSR, updateEnvelope]);

  return {
    handleADSRChange,
  };
};
