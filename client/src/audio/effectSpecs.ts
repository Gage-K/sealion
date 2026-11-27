import * as Tone from "tone";
import type { EffectName, TrackEffectsMap } from "../types/effects";

const RAMP = 0.02;

/** The concrete Tone node each insert effect builds. */
type NodeFor = {
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  chorus: Tone.Chorus;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Freeverb;
};

export type EffectNode = NodeFor[EffectName];

/**
 * One effect's audio behaviour: build its node, and reconcile a param change
 * onto an existing node. `apply` touches only the params that actually differ,
 * so a slider drag never re-creates a node — the diffing TrackChannel's
 * reconciliation relies on. This is the single place an effect's audio
 * knowledge lives; adding an effect is one entry here plus one control-schema
 * entry in types/effects.ts.
 */
export interface AudioEffectSpec<K extends EffectName> {
  create(params: TrackEffectsMap[K]): NodeFor[K];
  apply(
    node: NodeFor[K],
    prev: TrackEffectsMap[K] | undefined,
    next: TrackEffectsMap[K],
  ): void;
}

/** Identity helper that pins each entry's per-effect typing. */
function defineEffect<K extends EffectName>(
  spec: AudioEffectSpec<K>,
): AudioEffectSpec<K> {
  return spec;
}

export const AUDIO_EFFECT_SPECS: { [K in EffectName]: AudioEffectSpec<K> } = {
  filter: defineEffect<"filter">({
    create: (p) => new Tone.Filter({ frequency: p.cutoff, Q: p.q, type: p.type }),
    apply: (node, prev, next) => {
      if (prev?.cutoff !== next.cutoff) node.frequency.rampTo(next.cutoff, RAMP);
      if (prev?.q !== next.q) node.Q.rampTo(next.q, RAMP);
      if (prev?.type !== next.type) node.type = next.type;
    },
  }),

  distortion: defineEffect<"distortion">({
    create: (p) => new Tone.Distortion({ distortion: p.amount, wet: p.wet }),
    apply: (node, prev, next) => {
      if (prev?.amount !== next.amount) node.distortion = next.amount;
      if (prev?.wet !== next.wet) node.wet.rampTo(next.wet, RAMP);
    },
  }),

  chorus: defineEffect<"chorus">({
    create: (p) =>
      new Tone.Chorus({
        frequency: p.frequency,
        depth: p.depth,
        wet: p.wet,
      }).start(),
    apply: (node, prev, next) => {
      if (prev?.frequency !== next.frequency)
        node.frequency.rampTo(next.frequency, RAMP);
      if (prev?.depth !== next.depth) node.depth = next.depth;
      if (prev?.wet !== next.wet) node.wet.rampTo(next.wet, RAMP);
    },
  }),

  delay: defineEffect<"delay">({
    create: (p) =>
      new Tone.FeedbackDelay({
        delayTime: p.time,
        feedback: p.feedback,
        wet: p.wet,
        maxDelay: 1,
      }),
    apply: (node, prev, next) => {
      if (prev?.time !== next.time) node.delayTime.rampTo(next.time, RAMP);
      if (prev?.feedback !== next.feedback)
        node.feedback.rampTo(next.feedback, RAMP);
      if (prev?.wet !== next.wet) node.wet.rampTo(next.wet, RAMP);
    },
  }),

  reverb: defineEffect<"reverb">({
    create: (p) =>
      new Tone.Freeverb({
        roomSize: p.roomSize,
        dampening: p.dampening,
        wet: p.wet,
      }),
    apply: (node, prev, next) => {
      if (prev?.roomSize !== next.roomSize)
        node.roomSize.rampTo(next.roomSize, RAMP);
      if (prev?.dampening !== next.dampening) node.dampening = next.dampening;
      if (prev?.wet !== next.wet) node.wet.rampTo(next.wet, RAMP);
    },
  }),
};
