import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { Sequence, Envelope } from "../types/types";

/**
 * Initializes Tone.js drum synthesizers and initial audio routing. Cleans up synthesizers on unmount
 * @returns A Ref containing an array of the drum synthesizers
 */
export function useToneEngine(mode: "synth" | "drum", sequence: Sequence) {
  const synthsRef = useRef<
    (Tone.Synth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[]
  >([]);

  const [synthsReady, setSynthsReady] = useState(false);

  const getInitEnvelope = useCallback(() => {
    return sequence.map((_, index) => {
      const synth = synthsRef.current[index];
      if (synth?.envelope) {
        return {
          attack: Number(synth.envelope.attack),
          decay: Number(synth.envelope.decay),
          sustain: Number(synth.envelope.sustain),
          release: Number(synth.envelope.release),
        };
      }

      return { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.01 };
    });
  }, [sequence, synthsReady]);

  const updateEnvelope = useCallback(
    (trackIndex: number, envelope: Envelope) => {
      const synth = synthsRef.current[trackIndex];
      if (!synth?.envelope) {
        console.warn(`No synth or envelope found for track ${trackIndex}`);
        return;
      }

      console.log(`Updating envelope for track ${trackIndex}`);
      synth.envelope.attack = envelope.attack;
      synth.envelope.decay = envelope.decay;
      synth.envelope.sustain = envelope.sustain;
      synth.envelope.release = envelope.release;
    },
    []
  );

  useEffect(() => {
    if (synthsRef.current.length > 0) {
      return;
    }

    if (mode === "drum") {
      const kick = new Tone.MembraneSynth({
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.05 },
      }).connect(sequence[0].node); // get sent straight to output

      const hihat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(sequence[1].node);

      const snare = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
      }).connect(sequence[2].node);

      synthsRef.current = [kick, snare, hihat];
      setSynthsReady(true);
      console.log("[Audio Init] Drum synths created...");

      return () => {
        console.log("[Audio Init] Drum synth unmounted...");
        synthsRef.current.forEach((synth) => synth.dispose());
        synthsRef.current = [];
        setSynthsReady(false);
      };
    } else {
      console.error("[Audio] Synth mode not set");
    }
  }, []);

  return { synthsRef, getInitEnvelope, updateEnvelope, synthsReady }; // return also the function that updateEnvelope(trackIndex, adsr)
}
