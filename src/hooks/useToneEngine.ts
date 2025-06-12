import { useEffect, useRef } from "react";
import * as Tone from "tone";
import type { Sequence } from "../types/types";

/**
 * Initializes Tone.js drum synthesizers and initial audio routing. Cleans up synthesizers on unmount
 * @returns A Ref containing an array of the drum synthesizers
 */
export function useToneEngine(mode: "synth" | "drum", sequence: Sequence) {
  const synthsRef = useRef<
    (Tone.Synth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[]
  >([]);

  useEffect(() => {
    // TODO:
    // [ ] Improve abstraction of track output
    // [ ] Create placeholder node to control channel routing & handling track volume
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
      console.log("[Audio Init] Drum synths created...");

      return () => {
        console.log("[Audio Init] Drum synth unmounted...");
        synthsRef.current.forEach((synth) => synth.dispose());
        synthsRef.current = [];
      };
    } else {
      console.error("[Audio] Synth mode not set");
      // const synths = sequence.map(() =>
      //   new Tone.Synth().connect(volumeRef.current)
      // );
      // synthsRef.current = synths;

      // return () => {
      //   synthsRef.current = [];
      //   synths.forEach((synth) => synth.dispose());
      // };
    }
  }, [mode]);

  return synthsRef;
}
