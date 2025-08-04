import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Step } from "../types/crdt";
import { useCRDT } from "./useCRDT";
import type { AudioTrack } from "../types/types";

/**
 * Initializes and handles the Tone.js clock for controlling playback, triggering audio, setting beat movement, and playing metronome
 * @param sequence
 * @param synthsRef
 * @param mode
 * @returns Current step in the sequence, state of playback, and function to toggle playback
 */
export function useTransport(
  audioConfig: AudioTrack[],
  synthsRef: React.RefObject<
    (
      | Tone.MembraneSynth
      | Tone.NoiseSynth
      | Tone.MetalSynth
      | Tone.Synth<Tone.SynthOptions>
    )[]
  >,
  mode: "synth" | "drum",
  sequenceData: Step[][]
) {
  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  // Refs
  const beatRef = useRef(0);
  const sequenceRef = useRef(sequenceData);
  const scheduled = useRef(false);

  // Context
  const drumSynthCRDT = useCRDT();

  useEffect(() => {
    sequenceRef.current = sequenceData;
  }, [sequenceData]);

  const repeat = useCallback((time: number) => {
    console.log("[Audio] Repeat started");
    setCurrentStep(beatRef.current);

    sequenceRef.current.forEach((_, index) => {
      const synth = synthsRef.current[index];
      const note = drumSynthCRDT.getTrackSequence(index)[beatRef.current];

      if (note[0]) {
        if (mode === "drum") {
          if (synth instanceof Tone.NoiseSynth) {
            synth.triggerAttackRelease("16n", time);
          } else if (synth instanceof Tone.MembraneSynth) {
            synth.triggerAttackRelease("C1", "16n", time);
          } else if (synth instanceof Tone.MetalSynth) {
            synth.triggerAttackRelease("C4", "16n", time);
          }
        } else {
          // (synth as Tone.Synth).triggerAttackRelease(note[1], "16n", time);
        }
      }
    });

    // Advances the step / beat
    beatRef.current = (beatRef.current + 1) % 16;
  }, []);

  useEffect(() => {
    if (scheduled.current) return;

    scheduled.current = true;
    const id = Tone.getTransport().scheduleRepeat(repeat, "16n");

    return () => {
      Tone.getTransport().clear(id);
      scheduled.current = false;
      console.log("[Audio] Clearing transport");
    };
  }, []);

  const togglePlay = async () => {
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }

    if (isPlaying) {
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      setIsPlaying(false);
    } else {
      beatRef.current = 0;
      setCurrentStep(0);
      Tone.getTransport().start();
      setIsPlaying(true);
    }
  };

  return {
    isPlaying,
    currentStep,
    togglePlay,
  };
}
