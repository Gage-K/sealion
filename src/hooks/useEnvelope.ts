import { useState, useEffect } from "react";
import { type Envelope } from "../types/types";
import { useCRDT } from "./useCRDT";
import { DrumSynthCRDT } from "../types/crdt";

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
  const [trackADSR, setTrackADSR] = useState<Envelope[]>(
    drumSynthCRDT.tracks.map((track) => track.settings.envelope)
  );

  useEffect(() => {
    const unsubscribe = drumSynthCRDT.tracks[
      currentTrackIndex
    ].settings.subscribe(() => {
      setTrackADSR(
        drumSynthCRDT.tracks.map((track) => track.settings.envelope)
      );
    });
    return unsubscribe;
  }, [drumSynthCRDT, currentTrackIndex]);

  // Updates the ADSR for the current track; ADSR is an array of objects; maps over each ADSR object and updates specified parameter with value
  const handleADSRChange = (parameter: keyof Envelope, value: number) => {
    const newADSR = {
      ...drumSynthCRDT.tracks[currentTrackIndex].settings.envelope,
      [parameter]: value,
    };
    drumSynthCRDT.tracks[currentTrackIndex].settings.setEnvelope(newADSR);
  };

  // Update the tone engine when envelope changes
  useEffect(() => {
    if (trackADSR[currentTrackIndex]) {
      updateEnvelope(currentTrackIndex, trackADSR[currentTrackIndex]);
    }
  }, [trackADSR, currentTrackIndex, updateEnvelope]);

  return {
    handleADSRChange,
  };
};
