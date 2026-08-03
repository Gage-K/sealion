import { clamp } from "../audio/units";

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

/**
 * Legal range for every numeric parameter, per Tone.js.
 */
export const EFFECT_RANGES = {
  delay: { time: [0.001, 1], feedback: [0, 0.95], wet: [0, 1] },
  reverb: { roomSize: [0, 0.95], dampening: [200, 20000], wet: [0, 1] },
  chorus: { frequency: [0.05, 20], depth: [0, 1], wet: [0, 1] },
  distortion: { amount: [0, 1], wet: [0, 1] },
  filter: { cutoff: [20, 20000], q: [0, 20] },
  lfo: { rate: [0.05, 20], depth: [0, 1] },
} as const satisfies {
  [K in EffectKey]: Partial<
    Record<keyof TrackEffectsMap[K], readonly [number, number]>
  >;
};

export function clampEffect<K extends EffectKey>(
  name: K,
  params: TrackEffectsMap[K],
): TrackEffectsMap[K] {
  const ranges = EFFECT_RANGES[name] as Record<
    string,
    readonly [number, number] | undefined
  >;
  const out = { ...params } as Record<string, unknown>;
  const defaults = DEFAULT_TRACK_EFFECTS[name] as Record<string, unknown>;

  for (const [key, range] of Object.entries(ranges)) {
    if (!range) continue;
    const value = out[key];
    out[key] =
      typeof value === "number" && !Number.isNaN(value)
        ? clamp(value, range[0], range[1])
        : defaults[key];
  }

  return out as TrackEffectsMap[K];
}
