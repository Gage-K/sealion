export type Waveform = "sine" | "square" | "triangle" | "sawtooth";

export interface TrackState {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  vol: number;
  pan: number;
  waveform: Waveform;
}

export type EffectName = "delay" | "reverb" | "chorus" | "distortion" | "filter";

export type FilterType = "lowpass" | "highpass" | "bandpass";

export interface EffectsState {
  delay: { time: number; feedback: number; wet: number };
  reverb: { decay: number; preDelay: number; wet: number };
  chorus: { frequency: number; depth: number; wet: number };
  distortion: { amount: number; wet: number };
  filter: { cutoff: number; resonance: number; type: FilterType };
}

export type LfoTarget = "cutoff" | "resonance" | "volume" | "pan" | "pitch";

export interface LfoState {
  rate: number;
  depth: number;
  waveform: Waveform;
  target: LfoTarget;
}

export const defaultTrack = (): TrackState => ({
  attack: 50,
  decay: 50,
  sustain: 50,
  release: 50,
  vol: 50,
  pan: 0,
  waveform: "sine",
});

export const defaultEffects = (): EffectsState => ({
  delay: { time: 50, feedback: 50, wet: 50 },
  reverb: { decay: 50, preDelay: 50, wet: 50 },
  chorus: { frequency: 50, depth: 50, wet: 50 },
  distortion: { amount: 50, wet: 50 },
  filter: { cutoff: 100, resonance: 0, type: "lowpass" },
});

export const defaultLfo = (): LfoState => ({
  rate: 50,
  depth: 50,
  waveform: "sine",
  target: "cutoff",
});
