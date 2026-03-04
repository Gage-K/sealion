import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "../audio/AudioEngine";
import { useCRDT } from "./useCRDT";
import { useWebSocketSync } from "./useWebSocketSync";
import type { Envelope } from "../types/crdt";

export function useAudioEngine() {
  const crdt = useCRDT();
  const { sendUpdate } = useWebSocketSync();
  const engineRef = useRef<AudioEngine | null>(null);
  const crdtRef = useRef(crdt);
  crdtRef.current = crdt;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [bpm, setBpm] = useState(crdt.globalSettings.bpm);
  const [swing, setSwing] = useState(crdt.globalSettings.swing);
  const [volume, setVolume] = useState(0);
  const [envelopes, setEnvelopes] = useState<Envelope[]>(() =>
    crdt.tracks.map((t) => t.settings.envelope)
  );

  // Audio Engine is a singleton that is only created once on page load
  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;

    engine.onPlayingChange = (playing) => setIsPlaying(playing);

    engine.init(crdtRef.current);

    setIsPlaying(false);
    setCurrentStep(null);

    engine.setBPM(crdtRef.current.globalSettings.bpm);
    engine.setSwing(crdtRef.current.globalSettings.swing);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Poll engine beat via requestAnimationFrame for display sync
  useEffect(() => {
    if (!isPlaying) {
      setCurrentStep(null);
      return;
    }

    let rafId: number;
    const poll = () => {
      const engine = engineRef.current;
      if (engine) {
        setCurrentStep(engine.beat);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  // Subscribe to global settings changes
  useEffect(() => {
    const unsubscribe = crdt.globalSettings.subscribe(() => {
      const newBpm = crdt.globalSettings.bpm;
      const newSwing = crdt.globalSettings.swing;
      setBpm(newBpm);
      setSwing(newSwing);
      engineRef.current?.setBPM(newBpm);
      engineRef.current?.setSwing(newSwing);
    });
    return unsubscribe;
  }, [crdt]);

  // Subscribe to each track's settings for envelope sync
  useEffect(() => {
    const unsubs = crdt.tracks.map((track, i) =>
      track.settings.subscribe(() => {
        const env = track.settings.envelope;
        engineRef.current?.updateEnvelope(i, env);
        setEnvelopes((prev) => {
          const next = [...prev];
          next[i] = env;
          return next;
        });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [crdt]);

  const togglePlay = useCallback(() => {
    engineRef.current?.togglePlay();
  }, []);

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

  const handleVolumeChange = useCallback(
    (value: number) => {
      const clamped = Math.min(Math.max(value, -12), 8);
      setVolume(clamped);
      engineRef.current?.setVolume(clamped);
    },
    []
  );

  const handleEnvelopeChange = useCallback(
    (trackIndex: number, parameter: keyof Envelope, value: number) => {
      const newEnvelope = {
        ...crdt.tracks[trackIndex].settings.envelope,
        [parameter]: value,
      };
      crdt.tracks[trackIndex].settings.setEnvelope(newEnvelope);
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
    isPlaying,
    currentStep,
    bpm,
    swing,
    volume,
    envelopes,
    togglePlay,
    handleBPMChange,
    handleSwingChange,
    handleVolumeChange,
    handleEnvelopeChange,
    handleSequenceToggle,
  };
}
