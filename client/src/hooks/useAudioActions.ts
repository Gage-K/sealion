import { useCallback } from "react";
import type { Envelope } from "../types/crdt";
import { useCRDT } from "./useCRDT";
import { useWebSocket } from "./useWebSocket";
import { useAudioEngine } from "./useAudioEngine";

/**
 * Write actions for the synth. Collaborative changes mutate the CRDT and
 * broadcast; the engine reacts to those CRDT changes on its own. Volume and
 * playback are engine-local and don't touch the CRDT.
 */
export function useAudioActions() {
  const crdt = useCRDT();
  const engine = useAudioEngine();
  const { sendUpdate } = useWebSocket();

  const togglePlay = useCallback(() => {
    engine.togglePlay();
  }, [engine]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      engine.setVolume(value);
    },
    [engine]
  );

  const handleBPMChange = useCallback(
    (value: number) => {
      crdt.globalSettings.setBPM(value);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleSwingChange = useCallback(
    (value: number) => {
      crdt.globalSettings.setSwing(value);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleEnvelopeChange = useCallback(
    (trackIndex: number, parameter: keyof Envelope, value: number) => {
      const next = {
        ...crdt.tracks[trackIndex].settings.envelope,
        [parameter]: value,
      };
      crdt.tracks[trackIndex].settings.setEnvelope(next);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleSequenceToggle = useCallback(
    (trackIndex: number, stepIndex: number) => {
      crdt.tracks[trackIndex].sequence.toggleStep(stepIndex);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  return {
    togglePlay,
    handleVolumeChange,
    handleBPMChange,
    handleSwingChange,
    handleEnvelopeChange,
    handleSequenceToggle,
  };
}
