import * as Tone from "tone";

interface DrumSynthConfig {
  name: string;
  type: "membrane" | "metal" | "noise" | "pluck";
  note: string;
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  synthOptions?: {
    noise?: { type: "white" | "brown" | "pink" };
    harmonicity?: number;
    modulationIndex?: number;
    resonance?: number;
    octaves?: number;
    oscillator?: Partial<Tone.SynthOptions>;
  };
}

export const DRUM_SYNTH_CONFIG: DrumSynthConfig[] = [
  {
    name: "1",
    type: "membrane",
    note: "C1",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
  },
  {
    name: "2",
    type: "noise",
    note: "C1",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
    synthOptions: {
      noise: { type: "white" },
    },
  },
  {
    name: "3",
    type: "metal",
    note: "C2",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
    synthOptions: {
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    },
  },
  {
    name: "4",
    type: "metal",
    note: "C4",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
    synthOptions: {
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    },
  },
  {
    name: "5",
    type: "membrane",
    note: "C3",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
  },
  {
    name: "6",
    type: "membrane",
    note: "C4",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
  },
  {
    name: "7",
    type: "noise",
    note: "C1",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
    synthOptions: {
      noise: { type: "pink" },
    },
  },
  {
    name: "8",
    type: "membrane",
    note: "G4",
    envelope: {
      attack: 0.001,
      decay: 0.001,
      sustain: 0.001,
      release: 0.001,
    },
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
  if (synth instanceof Tone.NoiseSynth) {
    synth.triggerAttackRelease("16n", time);
  } else {
    synth.triggerAttackRelease(DRUM_SYNTH_CONFIG[trackIndex].note, "16n", time);
  }
}
