import * as Tone from "tone";

export interface Step {
  note: string;
  active: boolean;
}

export interface Track {
  name: string;
  steps: Step[];
  volume?: number;
  mute?: boolean;
  active?: boolean;
  node: Tone.ToneAudioNode;
}

export type Sequence = Track[];

export type Octave = Array<string>;

export type Scale = Array<number>;

export type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export type ModeName =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "pentatonic";
