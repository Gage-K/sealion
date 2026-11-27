import * as Tone from "tone";
import { DRUM_SYNTH_CONFIG, playDrumSynth } from "../config/drumSynthConfig";
import { TrackChannel } from "./TrackChannel";
import { clamp } from "./units";
import type { DrumSynthCRDT } from "../types/crdt";
import type { Envelope } from "../types/crdt";

type DrumSynth =
  | Tone.MembraneSynth
  | Tone.MetalSynth
  | Tone.NoiseSynth
  | Tone.Synth<Tone.SynthOptions>;

export class AudioEngine {
  private synths: DrumSynth[] = [];
  private channels: TrackChannel[] = [];
  private panner: Tone.Panner | null = null;
  private volumeNode: Tone.Volume | null = null;
  private fft: Tone.FFT | null = null;
  private transportEventId: number | null = null;
  beat = 0;
  isPlaying = false;
  volume = 0;
  private crdt: DrumSynthCRDT | null = null;
  private crdtUnsubs: (() => void)[] = [];
  private disposed = false;

  private listeners: (() => void)[] = [];

  subscribe = (listener: () => void) => {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getIsPlaying = () => this.isPlaying;
  getBeat = () => this.beat;
  getVolume = () => this.volume;

  init(crdt: DrumSynthCRDT) {
    if (this.synths.length > 0) return;

    this.crdt = crdt;
    this.disposed = false;

    this.volumeNode = new Tone.Volume({
      volume: 0,
      mute: false,
    }).toDestination();

    this.fft = new Tone.FFT(256);
    this.volumeNode.connect(this.fft);

    this.panner = new Tone.Panner(
      clamp(crdt.globalSettings.pan, -1, 1),
    ).connect(this.volumeNode);

    this.channels = DRUM_SYNTH_CONFIG.map(
      (config) => new TrackChannel(config.gain, this.panner!),
    );

    this.synths = DRUM_SYNTH_CONFIG.map((config, i) => {
      const envelope = crdt.tracks[i].settings.envelope;
      const envelopeOpts = {
        attack: envelope.attack,
        decay: envelope.decay,
        sustain: envelope.sustain,
        release: envelope.release,
      };

      switch (config.type) {
        case "membrane":
          return new Tone.MembraneSynth({
            ...config.membrane,
            envelope: envelopeOpts,
          }).connect(this.channels[i].input);
        case "metal":
          return new Tone.MetalSynth({
            ...config.metal,
            envelope: envelopeOpts,
          }).connect(this.channels[i].input);
        case "noise":
          return new Tone.NoiseSynth({
            noise: config.noise,
            envelope: envelopeOpts,
          }).connect(this.channels[i].input);
        default:
          return new Tone.Synth().connect(this.channels[i].input);
      }
    });

    const transport = Tone.getTransport();
    transport.cancel();
    transport.stop();
    transport.position = 0;
    this.beat = 0;

    this.setBPM(crdt.globalSettings.bpm);
    this.setSwing(crdt.globalSettings.swing);

    this.crdtUnsubs.push(
      crdt.globalSettings.subscribe(() => {
        this.setBPM(crdt.globalSettings.bpm);
        this.setSwing(crdt.globalSettings.swing);
        this.setPan(crdt.globalSettings.pan);
      }),
    );
    crdt.tracks.forEach((track, i) => {
      this.crdtUnsubs.push(
        track.settings.subscribe(() => {
          try {
            this.updateEnvelope(i, track.settings.envelope);
            this.channels[i]?.update(
              track.settings.effects,
              track.settings.mixer,
            );
          } catch (err) {
            console.error(`[AudioEngine] track ${i} update failed`, err);
          }
        }),
      );
    });

    crdt.tracks.forEach((track, i) => {
      try {
        this.channels[i].update(track.settings.effects, track.settings.mixer);
      } catch (err) {
        console.error(`[AudioEngine] track ${i} initial apply failed`, err);
      }
    });
  }

  private repeat(time: number) {
    if (!this.crdt || this.disposed) return;

    const beat = this.beat;

    for (let i = 0; i < this.synths.length; i++) {
      const step = this.crdt.getTrackSequence(i)[beat];
      if (step[0]) {
        playDrumSynth(this.synths[i], i, time);
      }
    }

    this.beat = (this.beat + 1) % 16;
    this.notify();
  }

  async togglePlay() {
    if (Tone.getContext().state !== "running") {
      await Tone.start();
    }

    const transport = Tone.getTransport();

    if (transport.state === "started") {
      transport.stop();
      if (this.transportEventId !== null) {
        transport.clear(this.transportEventId);
        this.transportEventId = null;
      }
      transport.seconds = 0;
      this.beat = 0;
      this.isPlaying = false;
      this.notify();
    } else {
      transport.cancel();
      this.transportEventId = null;
      transport.seconds = 0;
      this.beat = 0;
      // Schedule a single fresh repeat from position 0
      this.transportEventId = transport.scheduleRepeat(
        (time) => this.repeat(time),
        "16n",
      );
      transport.start();
      this.isPlaying = true;
      this.notify();
    }
  }

  setBPM(bpm: number) {
    Tone.getTransport().bpm.value = bpm;
  }

  setSwing(swing: number) {
    Tone.getTransport().swing = swing;
  }

  setPan(pan: number) {
    if (!this.panner) return;
    this.panner.pan.rampTo(clamp(Number.isFinite(pan) ? pan : 0, -1, 1), 0.02);
  }

  setVolume(db: number) {
    const clamped = Math.min(Math.max(db, -12), 8);
    this.volume = clamped;
    if (this.volumeNode) {
      this.volumeNode.volume.value = clamped;
    }
    this.notify();
  }

  updateEnvelope(trackIndex: number, envelope: Envelope) {
    const synth = this.synths[trackIndex];
    if (!synth?.envelope) return;
    synth.envelope.attack = envelope.attack;
    synth.envelope.decay = envelope.decay;
    synth.envelope.sustain = envelope.sustain;
    synth.envelope.release = envelope.release;
  }

  getFFTData(): Float32Array | undefined {
    return this.fft?.getValue();
  }

  dispose() {
    this.disposed = true;

    this.crdtUnsubs.forEach((u) => u());
    this.crdtUnsubs = [];

    const transport = Tone.getTransport();
    transport.stop();

    if (this.transportEventId !== null) {
      transport.clear(this.transportEventId);
      this.transportEventId = null;
    }

    this.synths.forEach((s) => s.dispose());
    this.synths = [];

    this.channels.forEach((c) => c.dispose());
    this.channels = [];

    if (this.panner) {
      this.panner.dispose();
      this.panner = null;
    }

    if (this.volumeNode) {
      this.volumeNode.dispose();
      this.volumeNode = null;
    }

    if (this.fft) {
      this.fft.dispose();
      this.fft = null;
    }

    this.crdt = null;
    this.listeners = [];
    this.isPlaying = false;
    this.beat = 0;
  }
}
