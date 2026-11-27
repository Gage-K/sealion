import { DEFAULT_TRACK_EFFECTS } from "./effects";
import type { EffectKey, EffectValue, TrackEffectsMap } from "./effects";

/**
 * Expand a list of 1-based active step numbers into a 16-slot boolean row,
 * used to seed a track's default pattern.
 */
function patternToSteps(pattern: number[] = []): boolean[] {
  const row = Array<boolean>(16).fill(false);
  for (const step of pattern) {
    if (step >= 1 && step <= 16) row[step - 1] = true;
  }
  return row;
}

/**
 * Last Write Wins Register (LWW)
 * If received timestampe is less than local timestamp, register does not change
 * If received timestamp is greater than local timestamp, register overwrites local value with received value. Also, store the received timestamp and an identifier unique to the peer who wrote the value (their ID)
 * Break ties by comparing the local peer ID to that of the received peer ID
 */

class LWWRegister<T> {
  readonly id: string;
  state: [peer: string, timestamp: number, value: T];

  get value() {
    return this.state[2];
  }

  constructor(id: string, state: [string, number, T]) {
    this.id = id;
    this.state = state;
  }

  set(value: T) {
    this.state = [this.id, this.state[1] + 1, value];
  }

  merge(state: [peer: string, timestamp: number, value: T]) {
    const [remotePeer, remoteTimestamp] = state;
    const [localPeer, localTimestamp] = this.state;

    if (localTimestamp > remoteTimestamp) return;
    if (localTimestamp === remoteTimestamp && localPeer > remotePeer) return;

    this.state = state;
  }
}

type Value<T> = {
  [key: string]: T;
};

type State<T> = {
  [key: string]: LWWRegister<T | null>["state"];
};

class LWWMap<T> {
  readonly id: string;
  #data = new Map<string, LWWRegister<T | null>>(); // private property holding a map of keys to LWWRegister instances.

  constructor(id: string, state: State<T>) {
    this.id = id;

    for (const [key, register] of Object.entries(state)) {
      this.#data.set(key, new LWWRegister<T | null>(id, register));
    }
  }

  get value() {
    // iterate through keys and build up a map of each register's value
    const value: Value<T> = {};

    for (const [key, register] of this.#data.entries()) {
      if (register.value !== null) {
        value[key] = register.value;
      }
    }

    return value;
  }

  get state() {
    // iterate through keys and build up a map of each register's state
    const state: State<T> = {};

    for (const [key, register] of this.#data.entries()) {
      state[key] = register.state;
    }

    return state;
  }

  get(key: string) {
    return this.#data.get(key)?.value ?? undefined;
  }

  has(key: string) {
    return this.#data.get(key)?.value !== null;
  }

  /**
   * Given a key, find the register and set its value; if no register exists, create a new one with the given key and value
   * @param key
   * @param value
   */
  set(key: string, value: T) {
    const register = this.#data.get(key);

    if (register) {
      register.set(value);
    } else {
      this.#data.set(key, new LWWRegister(this.id, [this.id, 1, value]));
    }
  }

  delete(key: string) {
    this.#data.get(key)?.set(null);
  }

  /**
   * Recursively merge each key's register with incoming state for that key
   * If register exists, merge it; if not, create a new register with incoming state
   * @param state
   */
  merge(state: State<T>) {
    for (const [key, remote] of Object.entries(state)) {
      const local = this.#data.get(key);

      if (local) {
        local.merge(remote);
      } else {
        this.#data.set(key, new LWWRegister<T | null>(this.id, remote));
      }
    }
  }
}

export type Step = [active: boolean];

export type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};
export type Mixer = {
  volume: number;
  muted: boolean;
};

/**
 * Wire shape for one track's settings. `core` holds the envelope and mixer
 * under separate keys, `fx` holds one register per effect.
 *
 * These are deliberately separate registers rather than one blob. Every setter
 * writes `{ ...current, patch }`, and `current` falls back to the virtual
 * defaults. A single blob means any write promotes every untouched default
 * to a real timestamped value, and a peer's concurrent edit to an unrelated
 * field loses the tie-break and is discarded.
 */
export type TrackSettingsState = {
  core: State<Envelope | Mixer>;
  fx: State<EffectValue>;
};

export type GlobalSettings = {
  bpm: number;
  swing: number;
  pan: number;
};

/**
 * Per-track seed values the document is constructed with: the kit's tuned
 * envelope and default groove. Injected by the caller (the client reads them
 * from DRUM_SYNTH_CONFIG; the server supplies the same kit) so this package
 * carries no client audio config. The track count is `trackDefaults.length`.
 */
export type TrackDefault = {
  envelope: Envelope;
  /** 1-based active step numbers that seed this track's default pattern. */
  pattern?: number[];
};

type Listener = () => void;

class GlobalSettingsCRDT {
  readonly id: string;
  #data: LWWMap<GlobalSettings>;

  constructor(id: string, state: State<GlobalSettings> = {}) {
    this.id = id;
    this.#data = new LWWMap(id, state);
  }

  static settingsKey() {
    return "global-settings";
  }

  get value(): GlobalSettings {
    const settings = this.#data.get(GlobalSettingsCRDT.settingsKey());

    return (
      settings ?? {
        bpm: 120,
        swing: 0.0,
        pan: 0.0,
      }
    );
  }

  get state() {
    return this.#data.state;
  }

  get bpm() {
    return this.value.bpm;
  }

  get swing() {
    return this.value.swing;
  }

  get pan() {
    return this.value.pan;
  }

  setSettings(settings: GlobalSettings) {
    this.#data.set(GlobalSettingsCRDT.settingsKey(), settings);
  }

  setBPM(bpm: number) {
    const current = this.value;
    this.setSettings({ ...current, bpm });
    this.notify();
  }

  setSwing(swing: number) {
    const current = this.value;
    this.setSettings({ ...current, swing });
    this.notify();
  }

  setPan(pan: number) {
    const current = this.value;
    this.setSettings({ ...current, pan });
    this.notify();
  }

  merge(state: State<GlobalSettings>) {
    this.#data.merge(state);
    this.notifyRender();
  }

  private listeners: Listener[] = [];
  private localListeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Fired only by local writes (the set/toggle methods), never by merge(). The
   * sync transport subscribes here so applying a remote merge can't trigger a
   * re-broadcast, which would echo endlessly between peers.
   */
  subscribeLocal(listener: Listener) {
    this.localListeners.push(listener);
    return () => {
      this.localListeners = this.localListeners.filter((l) => l !== listener);
    };
  }

  // Local writes notify both channels; merge() calls notifyRender() instead so
  // remote state updates the UI without re-broadcasting.
  private notify() {
    this.listeners.forEach((l) => l());
    this.localListeners.forEach((l) => l());
  }

  private notifyRender() {
    this.listeners.forEach((l) => l());
  }
}

const FALLBACK_ENVELOPE: Envelope = {
  attack: 0.1,
  decay: 0.1,
  sustain: 0.1,
  release: 0.1,
};

const DEFAULT_MIXER: Mixer = { volume: 0.0, muted: false };

class TrackSettingsCRDT {
  readonly id: string;
  readonly trackIndex: number;
  // Envelope and mixer live under separate keys so editing one never rewrites
  // the other. See TrackSettingsState for why that matters on merge.
  #data: LWWMap<Envelope | Mixer>;
  // One register per effect, keyed by effect name, for the same reason as above
  #fx: LWWMap<EffectValue>;
  readonly #defaults: { envelope: Envelope; mixer: Mixer };
  readonly #fxDefaults: TrackEffectsMap;

  constructor(
    id: string,
    trackIndex: number,
    state: Partial<TrackSettingsState> = {},
    defaults: { envelope: Envelope; mixer: Mixer } = {
      envelope: FALLBACK_ENVELOPE,
      mixer: DEFAULT_MIXER,
    },
    fxDefaults: TrackEffectsMap = DEFAULT_TRACK_EFFECTS,
  ) {
    this.id = id;
    this.trackIndex = trackIndex;
    this.#data = new LWWMap(id, state.core ?? {});
    this.#fx = new LWWMap(id, state.fx ?? {});
    this.#defaults = defaults;
    this.#fxDefaults = fxDefaults;
  }

  // Single source of truth for the register keys.
  static envelopeKey() {
    return "envelope";
  }

  static mixerKey() {
    return "mixer";
  }

  get state(): TrackSettingsState {
    return { core: this.#data.state, fx: this.#fx.state };
  }

  get envelope(): Envelope {
    const stored = this.#data.get(TrackSettingsCRDT.envelopeKey()) as
      | Envelope
      | undefined;
    return stored ?? this.#defaults.envelope;
  }

  get mixer(): Mixer {
    const stored = this.#data.get(TrackSettingsCRDT.mixerKey()) as
      | Mixer
      | undefined;
    return stored ?? this.#defaults.mixer;
  }

  /**
   * The LWWMap is keyed by effect name but stores the union of every effect's
   * params, so this is the one place narrowing happens. Keeping LWWMap itself
   * non-generic-over-a-record avoids rippling mapped types through State<T>,
   * SequencerCRDT and GlobalSettingsCRDT.
   */
  getEffect<K extends EffectKey>(name: K): TrackEffectsMap[K] {
    const stored = this.#fx.get(name) as TrackEffectsMap[K] | undefined;
    return stored ?? this.#fxDefaults[name];
  }

  get effects(): TrackEffectsMap {
    return {
      delay: this.getEffect("delay"),
      reverb: this.getEffect("reverb"),
      chorus: this.getEffect("chorus"),
      distortion: this.getEffect("distortion"),
      filter: this.getEffect("filter"),
      lfo: this.getEffect("lfo"),
    };
  }

  setEnvelope(envelope: Envelope) {
    this.#data.set(TrackSettingsCRDT.envelopeKey(), envelope);
    this.notify();
  }

  setVolume(volume: number) {
    this.#data.set(TrackSettingsCRDT.mixerKey(), { ...this.mixer, volume });
    this.notify();
  }

  setMuted(muted: boolean) {
    this.#data.set(TrackSettingsCRDT.mixerKey(), { ...this.mixer, muted });
    this.notify();
  }

  setEffect<K extends EffectKey>(name: K, patch: Partial<TrackEffectsMap[K]>) {
    this.#fx.set(name, { ...this.getEffect(name), ...patch });
    this.notify();
  }

  merge(state: Partial<TrackSettingsState>) {
    this.#data.merge(state.core ?? {});
    this.#fx.merge(state.fx ?? {});
    this.notifyRender();
  }

  private listeners: Listener[] = [];
  private localListeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Fired only by local writes (the set/toggle methods), never by merge(). The
   * sync transport subscribes here so applying a remote merge can't trigger a
   * re-broadcast, which would echo endlessly between peers.
   */
  subscribeLocal(listener: Listener) {
    this.localListeners.push(listener);
    return () => {
      this.localListeners = this.localListeners.filter((l) => l !== listener);
    };
  }

  // Local writes notify both channels; merge() calls notifyRender() instead so
  // remote state updates the UI without re-broadcasting.
  private notify() {
    this.listeners.forEach((l) => l());
    this.localListeners.forEach((l) => l());
  }

  private notifyRender() {
    this.listeners.forEach((l) => l());
  }
}

/**
 * Class manages the state of a single track's sequence (i.e. the steps for that track)
 */
class SequencerCRDT {
  readonly id: string;
  readonly trackIndex: number;
  #data: LWWMap<Step>;
  // Virtual default pattern (e.g. a seeded groove). Like the settings default,
  // it's never written into the CRDT, so it only shows through for steps no one
  // has touched — real edits and merges always take precedence.
  readonly #defaults: boolean[];

  constructor(
    id: string,
    trackIndex: number,
    state: State<Step> = {},
    defaults: boolean[] = [],
  ) {
    this.id = id;
    this.trackIndex = trackIndex;
    this.#data = new LWWMap(id, state);
    this.#defaults = defaults;
  }

  static stepKey(stepIndex: number) {
    return `step-${stepIndex}`;
  }

  get value() {
    return this.#data.value;
  }

  get state() {
    return this.#data.state;
  }

  get sequence(): Step[] {
    return Array.from({ length: 16 }, (_, i) => this.getStep(i));
  }

  get fullSequence(): boolean[] {
    return this.sequence.map((step) => step[0]);
  }

  setStep(stepIndex: number, value: Step) {
    if (stepIndex < 0 || stepIndex >= 16) {
      throw new Error("Step index out of bounds");
    }
    this.#data.set(SequencerCRDT.stepKey(stepIndex), value);
  }

  getStep(stepIndex: number): Step {
    if (stepIndex < 0 || stepIndex >= 16) {
      throw new Error("Step index out of bounds");
    }

    const key = SequencerCRDT.stepKey(stepIndex);
    const register = this.#data.get(key);

    return register ?? [this.#defaults[stepIndex] ?? false];
  }

  toggleStep(stepIndex: number) {
    const currentStep = this.getStep(stepIndex);
    this.setStep(stepIndex, [!currentStep[0]]);
    this.notify();
  }

  clearStep(stepIndex: number) {
    this.setStep(stepIndex, [false]);
    this.notify();
  }

  clearAllSteps() {
    for (let i = 0; i < 16; i++) {
      this.clearStep(i);
    }
    this.notify();
  }

  merge(state: SequencerCRDT["state"]) {
    this.#data.merge(state);
    this.notifyRender();
  }

  private listeners: Listener[] = [];
  private localListeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Fired only by local writes (the set/toggle methods), never by merge(). The
   * sync transport subscribes here so applying a remote merge can't trigger a
   * re-broadcast, which would echo endlessly between peers.
   */
  subscribeLocal(listener: Listener) {
    this.localListeners.push(listener);
    return () => {
      this.localListeners = this.localListeners.filter((l) => l !== listener);
    };
  }

  // Local writes notify both channels; merge() calls notifyRender() instead so
  // remote state updates the UI without re-broadcasting.
  private notify() {
    this.listeners.forEach((l) => l());
    this.localListeners.forEach((l) => l());
  }

  private notifyRender() {
    this.listeners.forEach((l) => l());
  }
}

export class DrumSynthCRDT {
  readonly id: string;
  readonly globalSettings: GlobalSettingsCRDT;
  readonly tracks: { settings: TrackSettingsCRDT; sequence: SequencerCRDT }[];

  private listeners: Listener[] = [];
  private localListeners: Listener[] = [];
  private unsubscribeFunctions: (() => void)[] = [];

  // Cached, referentially-stable snapshots for useSyncExternalStore. Each is
  // rebuilt lazily only after the relevant sub-store changes, so getSnapshot
  // returns the SAME reference until that data actually changes — required, or
  // useSyncExternalStore re-renders in an infinite loop.
  private gridSnapshot: boolean[][] = [];
  private gridDirty = true;
  private envelopesSnapshot: Envelope[] = [];
  private envelopesDirty = true;
  private effectsSnapshot: TrackEffectsMap[] = [];
  private effectsDirty = true;
  private mixersSnapshot: Mixer[] = [];
  private mixersDirty = true;

  constructor(
    id: string,
    trackDefaults: TrackDefault[],
    state?: {
      global?: State<GlobalSettings>;
      tracks?: Array<{
        settings: Partial<TrackSettingsState>;
        sequence: State<Step>;
      }>;
    },
  ) {
    this.id = id;

    this.globalSettings = new GlobalSettingsCRDT(id, state?.global || {});

    this.tracks = trackDefaults.map((def, index) => {
      return {
        settings: new TrackSettingsCRDT(
          id,
          index,
          state?.tracks?.[index]?.settings || {},
          {
            envelope: def.envelope,
            mixer: { volume: 0.0, muted: false },
          },
        ),
        sequence: new SequencerCRDT(
          id,
          index,
          state?.tracks?.[index]?.sequence || {},
          patternToSteps(def.pattern),
        ),
      };
    });

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Render subscriptions fire on both local writes and applied merges, so the
    // UI reflects remote peers' edits. Local subscriptions re-emit only local
    // writes, which is what the sync transport broadcasts.

    // Global settings changes don't affect the cached array snapshots.
    this.unsubscribeFunctions.push(
      this.globalSettings.subscribe(() => this.notify()),
      this.globalSettings.subscribeLocal(() => this.notifyLocal()),
    );

    // Track changes invalidate the matching cached snapshot before notifying.
    this.tracks.forEach((track) => {
      this.unsubscribeFunctions.push(
        track.settings.subscribe(() => {
          this.envelopesDirty = true;
          this.effectsDirty = true;
          this.mixersDirty = true;
          this.notify();
        }),
        track.settings.subscribeLocal(() => this.notifyLocal()),
      );
      this.unsubscribeFunctions.push(
        track.sequence.subscribe(() => {
          this.gridDirty = true;
          this.notify();
        }),
        track.sequence.subscribeLocal(() => this.notifyLocal()),
      );
    });
  }

  // Arrow field: useSyncExternalStore calls subscribe bare (no `this`), so it
  // must be bound to the instance.
  subscribe = (listener: Listener) => {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  // Arrow field: the sync transport subscribes here to broadcast on local
  // writes. Fired only by set*/toggle* on a sub-store, never by merge().
  subscribeLocal = (listener: Listener) => {
    this.localListeners.push(listener);
    return () => {
      this.localListeners = this.localListeners.filter((l) => l !== listener);
    };
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private notifyLocal() {
    this.localListeners.forEach((l) => l());
  }

  // --- Stable snapshot getters for useSyncExternalStore --------------------
  // Arrow fields so they can be passed as bare references. Primitives are
  // inherently stable; arrays are served from the caches above.

  getBpm = () => this.globalSettings.bpm;

  getSwing = () => this.globalSettings.swing;

  getEnvelopes = (): Envelope[] => {
    if (this.envelopesDirty) {
      this.envelopesSnapshot = this.tracks.map((t) => t.settings.envelope);
      this.envelopesDirty = false;
    }
    return this.envelopesSnapshot;
  };

  getSequenceGrid = (): boolean[][] => {
    if (this.gridDirty) {
      this.gridSnapshot = this.tracks.map((t) => t.sequence.fullSequence);
      this.gridDirty = false;
    }
    return this.gridSnapshot;
  };

  getTrackEffects = (): TrackEffectsMap[] => {
    if (this.effectsDirty) {
      this.effectsSnapshot = this.tracks.map((t) => t.settings.effects);
      this.effectsDirty = false;
    }
    return this.effectsSnapshot;
  };

  getTrackMixers = (): Mixer[] => {
    if (this.mixersDirty) {
      this.mixersSnapshot = this.tracks.map((t) => t.settings.mixer);
      this.mixersDirty = false;
    }
    return this.mixersSnapshot;
  };

  getPan = () => this.globalSettings.pan;

  // Clean up subscriptions
  destroy() {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions = [];
    this.listeners = [];
    this.localListeners = [];
  }

  get state() {
    return {
      global: this.globalSettings.state,
      tracks: this.tracks.map((track) => ({
        settings: track.settings.state,
        sequence: track.sequence.state,
      })),
    };
  }

  // Convenience methods for common operations
  getTrack(trackIndex: number) {
    if (trackIndex < 0 || trackIndex >= this.tracks.length) {
      throw new Error(
        `Track index ${trackIndex} out of range (0-${this.tracks.length - 1})`,
      );
    }
    return this.tracks[trackIndex];
  }

  getTrackSequence(trackIndex: number): Step[] {
    return this.getTrack(trackIndex).sequence.sequence;
  }

  getAllTrackSequences() {
    return this.tracks.map((_, trackIndex) =>
      this.getTrackSequence(trackIndex),
    );
  }

  getTrackMixer(trackIndex: number): Mixer {
    return this.getTrack(trackIndex).settings.mixer;
  }

  merge(state: DrumSynthCRDT["state"]) {
    this.globalSettings.merge(state.global);

    for (let i = 0; i < this.tracks.length; i++) {
      if (state.tracks[i]) {
        this.tracks[i].settings.merge(state.tracks[i].settings);
        this.tracks[i].sequence.merge(state.tracks[i].sequence);
      }
    }

    this.notify();
  }
}
