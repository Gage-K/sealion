import * as Tone from "tone";
import { EFFECT_ORDER, clampEffect } from "../types/effects";
import type { EffectName, TrackEffectsMap } from "../types/effects";
import type { Mixer } from "../types/crdt";
import { clamp } from "./units";

const RAMP = 0.02;

const MIN_DB = -60;
const MAX_DB = 12;

type FxNodeMap = {
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  chorus: Tone.Chorus;
  delay: Tone.FeedbackDelay;
  reverb: Tone.Freeverb;
};

type InsertParams = Pick<TrackEffectsMap, EffectName>;

/**
 * One track's audio path: a fixed input trim, a lazily-built chain of insert
 * effects, and a fixed output channel strip.
 */
export class TrackChannel {
  readonly input: Tone.Gain;
  readonly out: Tone.Channel;

  #fx = new Map<EffectName, FxNodeMap[EffectName]>();
  #applied: Partial<TrackEffectsMap> = {};
  #appliedMixer: Mixer | null = null;
  #topology = "";
  #disposed = false;

  constructor(gain: number, destination: Tone.InputNode) {
    this.input = new Tone.Gain(gain);
    this.out = new Tone.Channel({ volume: 0, pan: 0 });
    this.out.connect(destination);
    this.input.connect(this.out);
  }

  /**
   * Reconcile the graph against CRDT state. Rebuilds the chain only when the
   * enabled set changes; otherwise touches only the params that actually
   * differ, so a slider drag never re-creates a node.
   */
  update(effects: TrackEffectsMap, mixer: Mixer) {
    if (this.#disposed) return;

    this.#applyMixer(mixer);

    const safe = Object.fromEntries(
      EFFECT_ORDER.map((n) => [n, clampEffect(n, effects[n])]),
    ) as InsertParams;

    const topology = EFFECT_ORDER.map(
      (n) => `${n}:${safe[n].enabled ? 1 : 0}`,
    ).join("|");

    if (topology !== this.#topology) {
      this.#topology = topology;
      this.#rebuild(
        EFFECT_ORDER.filter((n) => safe[n].enabled),
        safe,
      );
    }

    for (const name of EFFECT_ORDER) {
      if (this.#fx.has(name)) this.#applyEffect(name, safe[name]);
    }
  }

  #rebuild(active: readonly EffectName[], params: InsertParams) {
    for (const name of active) this.#ensure(name, params[name]);

    this.input.disconnect();
    for (const node of this.#fx.values()) node.disconnect();

    Tone.connectSeries(
      this.input,
      ...active.map((n) => this.#fx.get(n)!),
      this.out,
    );
  }

  /**
   * Create a node on first enable and keep it forever after; disabling only
   * unwires it. Re-creating on each toggle would lose param state and, for
   * worklet-backed nodes, cost far more than leaving an idle node in memory.
   */
  #ensure<K extends EffectName>(name: K, p: TrackEffectsMap[K]) {
    if (this.#fx.has(name)) return;

    let node: FxNodeMap[EffectName];
    switch (name) {
      case "filter": {
        const f = p as TrackEffectsMap["filter"];
        node = new Tone.Filter({ frequency: f.cutoff, Q: f.q, type: f.type });
        break;
      }
      case "distortion": {
        const d = p as TrackEffectsMap["distortion"];
        node = new Tone.Distortion({ distortion: d.amount, wet: d.wet });
        break;
      }
      case "chorus": {
        const c = p as TrackEffectsMap["chorus"];
        node = new Tone.Chorus({
          frequency: c.frequency,
          depth: c.depth,
          wet: c.wet,
        }).start();
        break;
      }
      case "delay": {
        const d = p as TrackEffectsMap["delay"];
        node = new Tone.FeedbackDelay({
          delayTime: d.time,
          feedback: d.feedback,
          wet: d.wet,
          maxDelay: 1,
        });
        break;
      }
      case "reverb": {
        const r = p as TrackEffectsMap["reverb"];
        node = new Tone.Freeverb({
          roomSize: r.roomSize,
          dampening: r.dampening,
          wet: r.wet,
        });
        break;
      }
    }

    this.#fx.set(name, node);
    this.#applied[name] = p;
  }

  #applyEffect<K extends EffectName>(name: K, next: TrackEffectsMap[K]) {
    const prev = this.#applied[name];
    if (prev === next) return;

    switch (name) {
      case "filter": {
        const n = next as TrackEffectsMap["filter"];
        const o = prev as TrackEffectsMap["filter"] | undefined;
        const node = this.#fx.get("filter") as Tone.Filter;
        if (o?.cutoff !== n.cutoff) node.frequency.rampTo(n.cutoff, RAMP);
        if (o?.q !== n.q) node.Q.rampTo(n.q, RAMP);
        if (o?.type !== n.type) node.type = n.type;
        break;
      }
      case "distortion": {
        const n = next as TrackEffectsMap["distortion"];
        const o = prev as TrackEffectsMap["distortion"] | undefined;
        const node = this.#fx.get("distortion") as Tone.Distortion;
        if (o?.amount !== n.amount) node.distortion = n.amount;
        if (o?.wet !== n.wet) node.wet.rampTo(n.wet, RAMP);
        break;
      }
      case "chorus": {
        const n = next as TrackEffectsMap["chorus"];
        const o = prev as TrackEffectsMap["chorus"] | undefined;
        const node = this.#fx.get("chorus") as Tone.Chorus;
        if (o?.frequency !== n.frequency)
          node.frequency.rampTo(n.frequency, RAMP);
        if (o?.depth !== n.depth) node.depth = n.depth;
        if (o?.wet !== n.wet) node.wet.rampTo(n.wet, RAMP);
        break;
      }
      case "delay": {
        const n = next as TrackEffectsMap["delay"];
        const o = prev as TrackEffectsMap["delay"] | undefined;
        const node = this.#fx.get("delay") as Tone.FeedbackDelay;
        if (o?.time !== n.time) node.delayTime.rampTo(n.time, RAMP);
        if (o?.feedback !== n.feedback) node.feedback.rampTo(n.feedback, RAMP);
        if (o?.wet !== n.wet) node.wet.rampTo(n.wet, RAMP);
        break;
      }
      case "reverb": {
        const n = next as TrackEffectsMap["reverb"];
        const o = prev as TrackEffectsMap["reverb"] | undefined;
        const node = this.#fx.get("reverb") as Tone.Freeverb;
        if (o?.roomSize !== n.roomSize) node.roomSize.rampTo(n.roomSize, RAMP);
        if (o?.dampening !== n.dampening) node.dampening = n.dampening;
        if (o?.wet !== n.wet) node.wet.rampTo(n.wet, RAMP);
        break;
      }
    }

    this.#applied[name] = next;
  }

  #applyMixer(mixer: Mixer) {
    const prev = this.#appliedMixer;
    const volume = Number.isFinite(mixer.volume)
      ? clamp(mixer.volume, MIN_DB, MAX_DB)
      : 0;

    if (prev?.volume !== volume) this.out.volume.rampTo(volume, RAMP);
    if (prev?.muted !== mixer.muted) this.out.mute = mixer.muted;

    this.#appliedMixer = { volume, muted: mixer.muted };
  }

  dispose() {
    this.#disposed = true;

    for (const node of this.#fx.values()) {
      if (node instanceof Tone.Chorus) node.stop();
    }

    this.input.dispose();
    for (const node of this.#fx.values()) node.dispose();
    this.#fx.clear();
    this.#applied = {};
    this.out.dispose();
  }
}
