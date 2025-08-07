import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import type { AudioTrack, Envelope } from "../types/types";
import { useCRDT } from "./useCRDT";
import { DRUM_SYNTH_CONFIG } from "../config/drumSynthConfig";

/**
 * Initializes Tone.js drum synthesizers and initial audio routing. Cleans up synthesizers on unmount
 * @returns A Ref containing an array of the drum synthesizers
 */
export function useToneEngine(
  mode: "synth" | "drum",
  audioConfig: AudioTrack[]
) {
  const synthsRef = useRef<
    (Tone.Synth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth)[]
  >([]);

  const [synthsReady, setSynthsReady] = useState(false);

  const drumSynthCRDT = useCRDT();

  const updateEnvelope = useCallback(
    (trackIndex: number, envelope: Envelope) => {
      const synth = synthsRef.current[trackIndex];
      if (!synth?.envelope) {
        console.warn(`No synth or envelope found for track ${trackIndex}`);
        return;
      }
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
      const synths = drumSynthCRDT.tracks.map((track, trackIndex) => {
        if (DRUM_SYNTH_CONFIG[trackIndex].type === "membrane") {
          return new Tone.MembraneSynth({
            envelope: {
              attack: track.settings.envelope.attack,
              decay: track.settings.envelope.decay,
              sustain: track.settings.envelope.sustain,
              release: track.settings.envelope.release,
            },
          }).connect(audioConfig[trackIndex].node);
        } else if (DRUM_SYNTH_CONFIG[trackIndex].type === "metal") {
          return new Tone.MetalSynth({
            envelope: {
              attack: track.settings.envelope.attack,
              decay: track.settings.envelope.decay,
              sustain: track.settings.envelope.sustain,
              release: track.settings.envelope.release,
            },
            ...DRUM_SYNTH_CONFIG[trackIndex].synthOptions,
          }).connect(audioConfig[trackIndex].node);
        } else if (DRUM_SYNTH_CONFIG[trackIndex].type === "noise") {
          return new Tone.NoiseSynth({
            noise: DRUM_SYNTH_CONFIG[trackIndex].synthOptions?.noise,
            envelope: {
              attack: track.settings.envelope.attack,
              decay: track.settings.envelope.decay,
              sustain: track.settings.envelope.sustain,
              release: track.settings.envelope.release,
            },
          }).connect(audioConfig[trackIndex].node);
        }
        // Fallback - shouldn't happen
        return new Tone.Synth().connect(audioConfig[trackIndex].node);
      });

      synthsRef.current = synths;
      setSynthsReady(true);
      console.log("[Audio Init] Drum synths created...");
    }

    return () => {
      console.log("[Audio Init] Drum synth unmounted...");
      synthsRef.current.forEach((synth) => synth.dispose());
      synthsRef.current = [];
      setSynthsReady(false);
    };
  }, []);

  return { synthsRef, updateEnvelope, synthsReady }; // return also the function that updateEnvelope(trackIndex, adsr)
}
