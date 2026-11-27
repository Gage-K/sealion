import { clamp } from "../audio/units";
import {
  DEFAULT_TRACK_EFFECTS,
  type EffectKey,
  type EffectName,
  type TrackEffectsMap,
  type FilterType,
} from "@sealion/crdt";

// The effect *schema* (param types, TrackEffectsMap, EffectKey/Name/Value,
// EFFECT_ORDER, DEFAULT_TRACK_EFFECTS) now lives in @sealion/crdt so the server
// can share it. Re-exported here so the client's existing `../types/effects`
// imports keep resolving. The client-coupled parts below (Tone.js ranges,
// clamping, and the rack control schema) stay in the client.
export * from "@sealion/crdt";

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

// ---------------------------------------------------------------------------
// Rack control schema
//
// One declarative entry per insert effect describing the controls its rack
// renders. This is the single source for "which controls an effect has"; the
// numeric bounds still come from EFFECT_RANGES (the range owner), and format is
// a key the renderer resolves to a function, so the React-only formatters never
// have to be imported into this Tone-free module.
// ---------------------------------------------------------------------------

export const filterTypeOptions: { value: FilterType; label: string }[] = [
  { value: "lowpass", label: "lowpass" },
  { value: "highpass", label: "highpass" },
  { value: "bandpass", label: "bandpass" },
];

type NumericKeys<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T];
type StringKeys<T> = {
  [K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T];

/** A single rack control, typed against one effect's params `P`. */
export type ControlSpec<P> =
  | {
      kind: "range";
      param: NumericKeys<P>;
      label: string;
      step?: number;
      curve?: "linear" | "log";
      /** Resolved to a formatter in the renderer; omit for the raw value. */
      format?: "ms" | "normal" | "frequency";
    }
  | {
      kind: "select";
      param: StringKeys<P>;
      label: string;
      options: { value: P[StringKeys<P>]; label: string }[];
    };

/** Tab order in the rack UI — distinct from EFFECT_ORDER, the signal chain. */
export const EFFECT_TAB_ORDER = [
  "delay",
  "reverb",
  "chorus",
  "distortion",
  "filter",
] as const satisfies readonly EffectName[];

export const EFFECT_CONTROLS: {
  [K in EffectName]: { tabLabel: string; controls: ControlSpec<TrackEffectsMap[K]>[] };
} = {
  delay: {
    tabLabel: "dlay",
    controls: [
      { kind: "range", param: "time", label: "tim", step: 0.001, format: "ms" },
      { kind: "range", param: "feedback", label: "fdb", step: 0.01, format: "normal" },
      { kind: "range", param: "wet", label: "wet", step: 0.01, format: "normal" },
    ],
  },
  reverb: {
    tabLabel: "rvrb",
    controls: [
      { kind: "range", param: "roomSize", label: "rom", step: 0.01, format: "normal" },
      { kind: "range", param: "dampening", label: "dmp", curve: "log", format: "frequency" },
      { kind: "range", param: "wet", label: "wet", step: 0.01, format: "normal" },
    ],
  },
  chorus: {
    tabLabel: "chrs",
    controls: [
      { kind: "range", param: "frequency", label: "frq", step: 0.05, format: "frequency" },
      { kind: "range", param: "depth", label: "dpt", step: 0.01, format: "normal" },
      { kind: "range", param: "wet", label: "wet", step: 0.01, format: "normal" },
    ],
  },
  distortion: {
    tabLabel: "dist",
    controls: [
      { kind: "range", param: "amount", label: "amt", step: 0.01, format: "normal" },
      { kind: "range", param: "wet", label: "wet", step: 0.01, format: "normal" },
    ],
  },
  filter: {
    tabLabel: "fltr",
    controls: [
      { kind: "range", param: "cutoff", label: "cut", curve: "log", format: "frequency" },
      { kind: "range", param: "q", label: "res", step: 0.1 },
      { kind: "select", param: "type", label: "typ", options: filterTypeOptions },
    ],
  },
};
