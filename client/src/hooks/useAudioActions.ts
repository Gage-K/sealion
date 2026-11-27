import { useCallback } from "react";
import type { Envelope } from "../types/crdt";
import type { EffectKey, TrackEffectsMap } from "../types/effects";
import { useCRDT } from "./useCRDT";
import { useAudioEngine } from "./useAudioEngine";

/**
 * Write actions for the synth. Collaborative changes mutate the CRDT, which
 * broadcasts the local change on its own (see SyncProvider) — callers no longer
 * trigger the broadcast. Playback and *master* volume are engine-local and
 * don't touch the CRDT.
 *
 * Note the deliberate split between the two volume actions below: master volume
 * is a per-listener monitor level, so each peer sets their own. Per-track volume
 * is a musical decision about the mix, so it syncs like any other track setting.
 */
export function useAudioActions() {
  const crdt = useCRDT();
  const engine = useAudioEngine();

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
    },
    [crdt]
  );

  const handleSwingChange = useCallback(
    (value: number) => {
      crdt.globalSettings.setSwing(value);
    },
    [crdt]
  );

  const handleEnvelopeChange = useCallback(
    (trackIndex: number, parameter: keyof Envelope, value: number) => {
      const next = {
        ...crdt.tracks[trackIndex].settings.envelope,
        [parameter]: value,
      };
      crdt.tracks[trackIndex].settings.setEnvelope(next);
    },
    [crdt]
  );

  const handleSequenceToggle = useCallback(
    (trackIndex: number, stepIndex: number) => {
      crdt.tracks[trackIndex].sequence.toggleStep(stepIndex);
    },
    [crdt]
  );

  const handlePanChange = useCallback(
    (value: number) => {
      crdt.globalSettings.setPan(value);
    },
    [crdt]
  );

  const handleEffectChange = useCallback(
    <K extends EffectKey>(
      trackIndex: number,
      name: K,
      patch: Partial<TrackEffectsMap[K]>
    ) => {
      crdt.tracks[trackIndex].settings.setEffect(name, patch);
    },
    [crdt]
  );

  const handleEffectToggle = useCallback(
    (trackIndex: number, name: EffectKey) => {
      const settings = crdt.tracks[trackIndex].settings;
      settings.setEffect(name, { enabled: !settings.getEffect(name).enabled });
    },
    [crdt]
  );

  const handleTrackVolumeChange = useCallback(
    (trackIndex: number, db: number) => {
      crdt.tracks[trackIndex].settings.setVolume(db);
    },
    [crdt]
  );

  const handleTrackMuteToggle = useCallback(
    (trackIndex: number) => {
      const settings = crdt.tracks[trackIndex].settings;
      settings.setMuted(!settings.mixer.muted);
    },
    [crdt]
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
