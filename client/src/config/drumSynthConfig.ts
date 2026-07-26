import * as Tone from "tone";

type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

interface DrumSynthConfig {
  /** Short label shown on the track button (keep <= 4 chars). */
  name: string;
  type: "membrane" | "metal" | "noise";
  /** Pitch for tonal voices; ignored by noise voices. */
  note: string;
  /** How long the note is held before release — shapes the tail. */
  duration: Tone.Unit.Time;
  /** Linear mix level for this voice (0-1), applied to its gain node. */
  gain: number;
  /** Editable per-track ADSR; seeded as the CRDT default for this track. */
  envelope: Envelope;
  /** Construction params for a MembraneSynth voice (kick / toms). Uses the
   * default sine oscillator; the pitch sweep comes from pitchDecay/octaves. */
  membrane?: {
    pitchDecay: number;
    octaves: number;
  };
  /** Construction params for a MetalSynth voice (hats / rim). */
  metal?: {
    harmonicity: number;
    modulationIndex: number;
    resonance: number;
    octaves: number;
  };
  /** Construction params for a NoiseSynth voice (snare / clap). */
  noise?: { type: "white" | "brown" | "pink" };
  /** 1-based step numbers that start active — seeds the default groove. */
  pattern?: number[];
}

/**
 * A standard 8-piece drum kit. Each voice uses the Tone.js engine best suited
 * to it, with envelopes and pitch-sweep params tuned to sound good out of the
 * box. The `envelope` here is seeded as the track's CRDT default, so the ADSR
 * controls start on these values and remain editable.
 */
export const DRUM_SYNTH_CONFIG: DrumSynthConfig[] = [
  {
    name: "KICK",
    type: "membrane",
    note: "C1",
    duration: "8n",
    gain: 1.0,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.2 },
    membrane: { pitchDecay: 0.05, octaves: 8 },
    // Amen break (first half): syncopated kick
    pattern: [1, 3, 11],
  },
  {
    name: "SNR",
    type: "noise",
    note: "C2",
    duration: "16n",
    gain: 0.8,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    noise: { type: "white" },
    // Amen break (first half): backbeats on 2 & 4 plus ghost/pickup snares
    pattern: [5, 8, 13, 16],
  },
  {
    name: "CLAP",
    type: "noise",
    note: "C2",
    duration: "16n",
    gain: 0.7,
    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.25 },
    noise: { type: "pink" },
  },
  {
    name: "CHH",
    type: "metal",
    note: "C6",
    duration: "32n",
    gain: 0.4,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.03 },
    metal: { harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 },
    // Amen break (first half): steady 8th-note ride
    pattern: [1, 3, 5, 7, 9, 11, 13, 15],
  },
  {
    name: "OHH",
    type: "metal",
    note: "C6",
    duration: "8n",
    gain: 0.4,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    metal: { harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 },
  },
  {
    name: "LTOM",
    type: "membrane",
    note: "G1",
    duration: "8n",
    gain: 0.85,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.6 },
    membrane: { pitchDecay: 0.1, octaves: 4 },
  },
  {
    name: "MTOM",
    type: "membrane",
    note: "C2",
    duration: "8n",
    gain: 0.85,
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 },
    membrane: { pitchDecay: 0.1, octaves: 4 },
  },
  {
    name: "RIM",
    type: "metal",
    note: "A5",
    duration: "32n",
    gain: 0.6,
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 },
    metal: { harmonicity: 8, modulationIndex: 40, resonance: 3000, octaves: 1.2 },
  },
];

export function playDrumSynth(
  synth:
    | Tone.MembraneSynth
    | Tone.MetalSynth
    | Tone.NoiseSynth
    | Tone.Synth<Tone.SynthOptions>,
  trackIndex: number,
  time?: number
) {
  const config = DRUM_SYNTH_CONFIG[trackIndex];
  if (synth instanceof Tone.NoiseSynth) {
    synth.triggerAttackRelease(config.duration, time);
  } else {
    synth.triggerAttackRelease(config.note, config.duration, time);
  }
}
