import * as Tone from "tone";
import { EFFECT_ORDER, clampEffect } from "../types/effects";
import type { EffectName, TrackEffectsMap } from "../types/effects";
import type { Mixer } from "../types/crdt";
import { AUDIO_EFFECT_SPECS } from "./effectSpecs";
import type { EffectNode } from "./effectSpecs";
import { clamp } from "./units";

const RAMP = 0.02;

const MIN_DB = -60;
const MAX_DB = 12;

type InsertParams = Pick<TrackEffectsMap, EffectName>;

/**
 * One track's audio path: a fixed input trim, a lazily-built chain of insert
 * effects, and a fixed output channel strip.
 */
export class TrackChannel {
  readonly input: Tone.Gain;
  readonly out: Tone.Channel;

  #fx = new Map<EffectName, EffectNode>();
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
    this.#fx.set(name, AUDIO_EFFECT_SPECS[name].create(p));
    this.#applied[name] = p;
  }

  #applyEffect<K extends EffectName>(name: K, next: TrackEffectsMap[K]) {
    const prev = this.#applied[name];
    if (prev === next) return;

    const node = this.#fx.get(name);
    if (!node) return;

    const spec = AUDIO_EFFECT_SPECS[name];
    spec.apply(node as Parameters<typeof spec.apply>[0], prev, next);

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
