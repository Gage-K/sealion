// Pure effect schema shared between client and server. This is the document
// side of effects only — the param shapes, the per-effect map, and the seeded
// defaults. The client-coupled parts (clamping against Tone.js ranges, the rack
// control specs, UI option lists) stay in the client's own effects module,
// which re-exports everything here.

export type FilterType = "lowpass" | "highpass" | "bandpass";
export type Waveform = "sine" | "square" | "triangle" | "sawtooth";
export type LfoTarget = "cutoff" | "resonance" | "volume" | "pan" | "pitch";

export type DelayParams = {
  enabled: boolean;
  /** Seconds. Capped at 1 — FeedbackDelay fixes maxDelay at construction. */
  time: number;
  feedback: number;
  wet: number;
};

export type ReverbParams = {
  enabled: boolean;
  roomSize: number;
  dampening: number;
  wet: number;
};

export type ChorusParams = {
  enabled: boolean;
  frequency: number;
  depth: number;
  wet: number;
};

export type DistortionParams = {
  enabled: boolean;
  amount: number;
  wet: number;
};

export type FilterParams = {
  enabled: boolean;
  cutoff: number;
  q: number;
  type: FilterType;
};

export type LfoParams = {
  enabled: boolean;
  rate: number;
  depth: number;
  waveform: Waveform;
  target: LfoTarget;
};

export type TrackEffectsMap = {
  delay: DelayParams;
  reverb: ReverbParams;
  chorus: ChorusParams;
  distortion: DistortionParams;
  filter: FilterParams;
  lfo: LfoParams;
};

export type EffectKey = keyof TrackEffectsMap;
export type EffectName = Exclude<EffectKey, "lfo">;
export type EffectValue = TrackEffectsMap[EffectKey];

// Signal-chain order for the insert effects.
export const EFFECT_ORDER = [
  "filter",
  "distortion",
  "chorus",
  "delay",
  "reverb",
] as const satisfies readonly EffectName[];

export const DEFAULT_TRACK_EFFECTS: TrackEffectsMap = {
  filter: { enabled: false, cutoff: 4000, q: 1, type: "lowpass" },
  distortion: { enabled: false, amount: 0.4, wet: 0.5 },
  chorus: { enabled: false, frequency: 1.5, depth: 0.7, wet: 0.5 },
  delay: { enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 },
  reverb: { enabled: false, roomSize: 0.7, dampening: 3000, wet: 0.3 },
  lfo: {
    enabled: false,
    rate: 2,
    depth: 0.5,
    waveform: "sine",
    target: "cutoff",
  },
};
