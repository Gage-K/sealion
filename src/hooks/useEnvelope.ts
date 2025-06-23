import { useState, useEffect } from "react";
import { type Envelope } from "../types/types";

interface UseEnvelopeProps {
  getInitADSR: () => Envelope[];
  updateEnvelope: (trackIndex: number, envelope: Envelope) => void;
  currentTrackIndex: number;
}

interface UseEnvelopeReturn {
  trackADSR: Envelope[];
  handleADSRChange: (parameter: keyof Envelope, value: number) => void;
  currentTrackEnvelope: Envelope;
}

export const useEnvelope = ({
  getInitADSR,
  updateEnvelope,
  currentTrackIndex,
}: UseEnvelopeProps): UseEnvelopeReturn => {
  const [trackADSR, setTrackADSR] = useState<Envelope[]>(getInitADSR());

  // Updates the ADSR for the current track; ADSR is an array of objects; maps over each ADSR object and updates specified parameter with value
  const handleADSRChange = (parameter: keyof Envelope, value: number) => {
    setTrackADSR((prev) =>
      prev.map((adsr, index) =>
        index === currentTrackIndex ? { ...adsr, [parameter]: value } : adsr
      )
    );
  };

  // Update the tone engine when envelope changes
  useEffect(() => {
    if (trackADSR[currentTrackIndex]) {
      updateEnvelope(currentTrackIndex, trackADSR[currentTrackIndex]);
    }
  }, [trackADSR, currentTrackIndex, updateEnvelope]);

  return {
    trackADSR,
    handleADSRChange,
    currentTrackEnvelope: trackADSR[currentTrackIndex],
  };
};
