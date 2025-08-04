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
export type TrackSettings = {
  envelope: Envelope;
  volume: number;
  muted: boolean;
};

export type GlobalSettings = {
  bpm: number;
  swing: number;
  pan: number;
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
    this.notify();
  }

  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

class TrackSettingsCRDT {
  readonly id: string;
  readonly trackIndex: number;
  #data: LWWMap<TrackSettings>;

  constructor(
    id: string,
    trackIndex: number,
    state: State<TrackSettings> = {}
  ) {
    this.id = id;
    this.trackIndex = trackIndex;
    this.#data = new LWWMap(id, state);
  }

  // provides a single source of truth for the key of track settings
  static settingsKey() {
    return "settings";
  }

  get value(): TrackSettings {
    const settings = this.#data.get(TrackSettingsCRDT.settingsKey());

    return (
      settings ?? {
        envelope: {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.1,
          release: 0.1,
        },
        volume: 0.0,
        muted: false,
      }
    );
  }

  get state() {
    return this.#data.state;
  }

  get envelope() {
    return this.value.envelope;
  }

  setSettings(settings: TrackSettings) {
    const key = TrackSettingsCRDT.settingsKey();
    this.#data.set(key, settings);
  }

  setEnvelope(envelope: Envelope) {
    const current = this.value;
    this.setSettings({ ...current, envelope });
    this.notify();
  }

  setVolume(volume: number) {
    const current = this.value;
    this.setSettings({ ...current, volume });
    this.notify();
  }

  setMuted(muted: boolean) {
    const current = this.value;
    this.setSettings({ ...current, muted });
    this.notify();
  }

  merge(state: State<TrackSettings>) {
    this.#data.merge(state);
    this.notify();
  }

  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
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

  constructor(id: string, trackIndex: number, state: State<Step> = {}) {
    this.id = id;
    this.trackIndex = trackIndex;
    this.#data = new LWWMap(id, state);
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

    return register ?? [false];
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
    this.notify();
  }

  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export class DrumSynthCRDT {
  readonly id: string;
  readonly globalSettings: GlobalSettingsCRDT;
  readonly tracks: [
    { settings: TrackSettingsCRDT; sequence: SequencerCRDT },
    { settings: TrackSettingsCRDT; sequence: SequencerCRDT },
    { settings: TrackSettingsCRDT; sequence: SequencerCRDT },
    { settings: TrackSettingsCRDT; sequence: SequencerCRDT }
  ];

  private listeners: Listener[] = [];
  private unsubscribeFunctions: (() => void)[] = [];

  constructor(
    id: string,
    state?: {
      global?: State<GlobalSettings>;
      tracks?: Array<{
        settings: State<TrackSettings>;
        sequence: State<Step>;
      }>;
    }
  ) {
    this.id = id;

    this.globalSettings = new GlobalSettingsCRDT(id, state?.global || {});

    this.tracks = [
      {
        settings: new TrackSettingsCRDT(
          id,
          0,
          state?.tracks?.[0]?.settings || {}
        ),
        sequence: new SequencerCRDT(id, 0, state?.tracks?.[0]?.sequence || {}),
      },
      {
        settings: new TrackSettingsCRDT(
          id,
          1,
          state?.tracks?.[1]?.settings || {}
        ),
        sequence: new SequencerCRDT(id, 1, state?.tracks?.[1]?.sequence || {}),
      },
      {
        settings: new TrackSettingsCRDT(
          id,
          2,
          state?.tracks?.[2]?.settings || {}
        ),
        sequence: new SequencerCRDT(id, 2, state?.tracks?.[2]?.sequence || {}),
      },
      {
        settings: new TrackSettingsCRDT(
          id,
          3,
          state?.tracks?.[3]?.settings || {}
        ),
        sequence: new SequencerCRDT(id, 3, state?.tracks?.[3]?.sequence || {}),
      },
    ];

    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // Subscribe to global settings changes
    this.unsubscribeFunctions.push(
      this.globalSettings.subscribe(() => this.notify())
    );

    // Subscribe to each track's settings and sequence changes
    this.tracks.forEach((track) => {
      this.unsubscribeFunctions.push(
        track.settings.subscribe(() => this.notify())
      );
      this.unsubscribeFunctions.push(
        track.sequence.subscribe(() => this.notify())
      );
    });
  }

  // Subscription methods for external listeners (like WebSocket sync)
  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Clean up subscriptions
  destroy() {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions = [];
    this.listeners = [];
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
    if (trackIndex < 0 || trackIndex >= 4) {
      throw new Error(`Track index ${trackIndex} out of range (0-3)`);
    }
    return this.tracks[trackIndex];
  }

  getTrackSequence(trackIndex: number): Step[] {
    return this.getTrack(trackIndex).sequence.sequence;
  }

  getAllTrackSequences() {
    return this.tracks.map((_, trackIndex) =>
      this.getTrackSequence(trackIndex)
    );
  }

  getTrackSettings(trackIndex: number): TrackSettings {
    return this.getTrack(trackIndex).settings.value;
  }

  merge(state: DrumSynthCRDT["state"]) {
    this.globalSettings.merge(state.global);

    for (let i = 0; i < 4; i++) {
      if (state.tracks[i]) {
        this.tracks[i].settings.merge(state.tracks[i].settings);
        this.tracks[i].sequence.merge(state.tracks[i].sequence);
      }
    }

    this.notify();
  }
}

// const agentASequencer = new SequencerCRDT("agentA", 0, {});

// agentASequencer.setStep(0, [true]);

// agentASequencer.setStep(0, [false]);

// agentASequencer.setStep(10, [true]);

// const agentADrum = new DrumSynthCRDT("agentA", {});

// // console.log(agentADrum.state.tracks[0].sequence);
// agentADrum.getTrack(0).sequence.setStep(0, [true]);
// agentADrum.getTrack(0).sequence.setStep(0, [false]);
// agentADrum.getTrack(0).sequence.setStep(10, [true]);
// // console.log(agentADrum.state.tracks[0].sequence);

// const agentBDrum = new DrumSynthCRDT("agentB", {});

// // console.log(agentBDrum.state.tracks[0].sequence);
// agentBDrum.getTrack(0).sequence.setStep(0, [true]);
// agentBDrum.getTrack(0).sequence.setStep(0, [false]);
// agentBDrum.getTrack(0).sequence.setStep(10, [true]);
// // console.log(agentBDrum.state.tracks[0].sequence);

// agentBDrum.merge(agentADrum.state);

// console.log(agentBDrum.state.tracks[0].sequence);

// console.log(
//   JSON.stringify(agentBDrum.tracks[0].sequence.fullSequence, null, 2)
// );

// agentADrum.tracks[0].sequence.setStep(0, [true]);

// agentBDrum.merge(agentADrum.state);

// console.log(
//   JSON.stringify(agentBDrum.tracks[0].sequence.fullSequence, null, 2)
// );
