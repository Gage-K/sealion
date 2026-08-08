import { useCallback } from "react";
import type { Envelope } from "../types/crdt";
import type { EffectKey, TrackEffectsMap } from "../types/effects";
import { useCRDT } from "./useCRDT";
import { useWebSocket } from "./useWebSocket";
import { useAudioEngine } from "./useAudioEngine";

/**
 * Write actions for the synth. Collaborative changes mutate the CRDT and
 * broadcast; the engine reacts to those CRDT changes on its own. Playback and
 * *master* volume are engine-local and don't touch the CRDT.
 *
 * Note the deliberate split between the two volume actions below: master volume
 * is a per-listener monitor level, so each peer sets their own. Per-track volume
 * is a musical decision about the mix, so it syncs like any other track setting.
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

  const handlePanChange = useCallback(
    (value: number) => {
      crdt.globalSettings.setPan(value);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleEffectChange = useCallback(
    <K extends EffectKey>(
      trackIndex: number,
      name: K,
      patch: Partial<TrackEffectsMap[K]>
    ) => {
      crdt.tracks[trackIndex].settings.setEffect(name, patch);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleEffectToggle = useCallback(
    (trackIndex: number, name: EffectKey) => {
      const settings = crdt.tracks[trackIndex].settings;
      settings.setEffect(name, { enabled: !settings.getEffect(name).enabled });
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleTrackVolumeChange = useCallback(
    (trackIndex: number, db: number) => {
      crdt.tracks[trackIndex].settings.setVolume(db);
      sendUpdate(crdt);
    },
    [crdt, sendUpdate]
  );

  const handleTrackMuteToggle = useCallback(
    (trackIndex: number) => {
      const settings = crdt.tracks[trackIndex].settings;
      settings.setMuted(!settings.mixer.muted);
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
    handlePanChange,
    handleEffectChange,
    handleEffectToggle,
    handleTrackVolumeChange,
    handleTrackMuteToggle,
  };
}
